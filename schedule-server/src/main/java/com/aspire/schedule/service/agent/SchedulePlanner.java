package com.aspire.schedule.service.agent;

import cn.hutool.json.JSONArray;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.aspire.schedule.repository.entity.Schedule;
import com.aspire.schedule.service.PromptTemplateService;
import com.aspire.schedule.service.agent.model.LLMResponse;
import com.aspire.schedule.service.agent.model.PlanResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class SchedulePlanner {

    private final LLMClient llmClient;
    private final PromptTemplateService promptTemplateService;

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    /**
     * 调用 LLM 生成排期方案
     */
    public PlanResult plan(String parsedItems, String deadline,
                           List<Schedule> existingSchedules, String userFeedback) {
        String systemPrompt = getSystemPrompt();

        StringBuilder userMessage = new StringBuilder();
        userMessage.append("当前日期：").append(LocalDate.now()).append("\n\n");

        userMessage.append("## 待排期的子任务\n");
        userMessage.append(parsedItems).append("\n\n");

        if (deadline != null && !deadline.isEmpty()) {
            userMessage.append("## 截止时间\n").append(deadline).append("\n\n");
        }

        userMessage.append("## 已有日程（以下时间段不可用）\n");
        if (existingSchedules.isEmpty()) {
            userMessage.append("目前无已有日程，所有工作时间均可安排。\n");
        } else {
            for (Schedule s : existingSchedules) {
                userMessage.append("- ").append(s.getTitle())
                        .append(": ").append(s.getStartTime().format(FORMATTER))
                        .append(" ~ ").append(s.getEndTime().format(FORMATTER)).append("\n");
            }
        }

        if (userFeedback != null && !userFeedback.isEmpty()) {
            userMessage.append("\n## 用户对上次排期方案的反馈\n");
            userMessage.append(userFeedback).append("\n");
            userMessage.append("请根据用户反馈调整排期方案。\n");
        }

        log.info("SchedulePlanner calling LLM, userMessage length={}", userMessage.length());

        LLMResponse response = llmClient.chat(systemPrompt, userMessage.toString());

        if (!response.isSuccess()) {
            log.warn("Schedule plan failed: {}", response.getErrorMsg());
            PlanResult fallback = new PlanResult();
            fallback.setWarnings(List.of("排期生成失败: " + response.getErrorMsg()));
            return fallback;
        }

        return parsePlanResponse(response.getContent());
    }

    private PlanResult parsePlanResponse(String content) {
        try {
            String json = content.trim();
            if (json.startsWith("```")) {
                json = json.replaceAll("```json|```", "").trim();
            }

            JSONObject obj = JSONUtil.parseObj(json);
            PlanResult result = new PlanResult();

            List<PlanResult.PlanItem> planItems = new ArrayList<>();
            if (obj.containsKey("plan")) {
                JSONArray arr = obj.getJSONArray("plan");
                for (int i = 0; i < arr.size(); i++) {
                    JSONObject item = arr.getJSONObject(i);
                    PlanResult.PlanItem planItem = new PlanResult.PlanItem();
                    planItem.setTaskTitle(item.getStr("taskTitle", item.getStr("taskName", "")));
                    planItem.setSuggestedStart(item.getStr("suggestedStart", ""));
                    planItem.setSuggestedEnd(item.getStr("suggestedEnd", ""));
                    planItem.setEstimatedHours(item.getDouble("estimatedHours", 0.0));
                    planItem.setPriority(item.getStr("priority", "MEDIUM"));
                    planItem.setConflictDetail(item.getStr("conflictDetail", ""));
                    planItems.add(planItem);
                }
            }
            result.setPlan(planItems);

            if (obj.containsKey("conflicts")) {
                JSONArray conflictsArr = obj.getJSONArray("conflicts");
                if (conflictsArr != null) {
                    result.setConflicts(conflictsArr.toList(String.class));
                }
            }

            if (obj.containsKey("warnings")) {
                JSONArray warningsArr = obj.getJSONArray("warnings");
                if (warningsArr != null) {
                    result.setWarnings(warningsArr.toList(String.class));
                }
            }

            return result;
        } catch (Exception e) {
            log.error("Failed to parse plan LLM response: {}", content, e);
            PlanResult fallback = new PlanResult();
            fallback.setWarnings(List.of("排期结果解析失败，请重试"));
            return fallback;
        }
    }

    private String getSystemPrompt() {
        var template = promptTemplateService.findByAgentTypeAndStatus("SCHEDULING");
        if (template != null) {
            return template.getContent();
        }
        return "你是一个排期规划专家。根据子任务列表、已有日程和截止时间，为每个子任务推荐合理的执行时间片。\n"
                + "## 规则\n"
                + "1. 避开已有日程占用的时间\n"
                + "2. 每天工作时间为 09:00-12:00 和 14:00-18:00\n"
                + "3. 如果一个连续时间段不够，可将任务拆分为多个时间片\n"
                + "4. 高优先级任务优先安排在较早的时间\n"
                + "5. 子任务若存在依赖关系，前置任务必须先安排\n\n"
                + "## 输出格式（严格 JSON）\n"
                + "{\n"
                + "  \"plan\": [{\"taskTitle\":\"...\",\"suggestedStart\":\"yyyy-MM-ddTHH:mm:ss\","
                + "\"suggestedEnd\":\"yyyy-MM-ddTHH:mm:ss\",\"estimatedHours\":number,\"priority\":\"HIGH|MEDIUM|LOW\"}],\n"
                + "  \"conflicts\": [\"冲突说明\"],\n"
                + "  \"warnings\": [\"风险提醒\"]\n"
                + "}";
    }
}
