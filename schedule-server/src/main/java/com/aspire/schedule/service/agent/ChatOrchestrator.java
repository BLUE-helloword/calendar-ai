package com.aspire.schedule.service.agent;

import cn.hutool.json.JSONArray;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.aspire.schedule.model.vo.ChatResponseVO;
import com.aspire.schedule.model.vo.PlanVO;
import com.aspire.schedule.repository.entity.Goal;
import com.aspire.schedule.repository.entity.Schedule;
import com.aspire.schedule.service.GoalService;
import com.aspire.schedule.service.ScheduleService;
import com.aspire.schedule.service.agent.model.ParseResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatOrchestrator {

    private static final Pattern CONFIRM_PATTERN =
            Pattern.compile("^(确认|好的|可以|行|没问题|ok|yes|确认排期|就这样|没问题了)[\\s\\S]*$",
                    Pattern.CASE_INSENSITIVE);

    private final GoalService goalService;
    private final AgentOrchestrator agentOrchestrator;
    private final PlanOrchestrator planOrchestrator;
    private final ScheduleService scheduleService;

    /**
     * 统一消息处理入口
     */
    public ChatResponseVO processMessage(String sessionId, String message, Long userId) {
        // 新会话
        if (sessionId == null || sessionId.isEmpty()) {
            return handleNewConversation(message, userId);
        }

        // 已有会话
        Long goalId;
        try {
            goalId = Long.parseLong(sessionId);
        } catch (NumberFormatException e) {
            return handleNewConversation(message, userId);
        }

        Goal goal = goalService.findById(goalId);
        if (goal == null) {
            return handleNewConversation(message, userId);
        }

        return handleExistingConversation(goal, message, userId);
    }

    private ChatResponseVO handleNewConversation(String message, Long userId) {
        // 检查是否是确认类消息（无上下文时无法确认）
        if (isConfirmMessage(message)) {
            return buildTextResponse(null,
                    "请先描述您想要安排的事项，我会帮您分析并生成排期方案。");
        }

        // 创建 Goal 并解析意图
        Goal goal = goalService.create(userId, message);
        ParseResult result = agentOrchestrator.processOneRound(
                goal.getId(), message, null, userId);

        if (result.isNeedsClarification()) {
            return buildClarifyResponse(goal.getId(), result);
        }

        // 解析完成，自动进入排期
        goalService.updateStatus(goal.getId(), "PARSED");
        PlanVO planVO = planOrchestrator.processPlanRound(goal.getId(), null, userId);
        return buildScheduleCardResponse(goal.getId(), planVO, goal.getParsedTarget());
    }

    private ChatResponseVO handleExistingConversation(Goal goal, String message, Long userId) {
        String status = goal.getStatus();

        // 检测确认意图
        if (isConfirmMessage(message)) {
            if ("PARSED".equals(status) || "PLANNED".equals(status)) {
                return buildTextResponse(goal.getId(),
                        "请点击下方的「确认排期」按钮来确认当前方案，或继续在对话中调整。\n\n" +
                        "当前排期方案已就绪，确认后将自动创建任务、日程和提醒。");
            }
            if ("CONFIRMED".equals(status)) {
                return buildTextResponse(goal.getId(),
                        "排期已确认，任务和日程已创建完成。您可以在日历视图或任务列表中查看。");
            }
        }

        // 根据状态路由
        if ("CLARIFYING".equals(status)) {
            return handleClarification(goal, message, userId);
        }

        if ("PARSED".equals(status) || "PLANNED".equals(status)) {
            return handleRefinement(goal, message, userId);
        }

        // 其他状态（PENDING, CONFIRMED 等）：当作新的排期调整请求
        return handleRefinement(goal, message, userId);
    }

    private ChatResponseVO handleClarification(Goal goal, String message, Long userId) {
        // 构建对话历史
        String history = goal.getConversation();
        if (history == null || history.isEmpty()) {
            history = "用户: " + goal.getRawInput();
        }
        history += "\n用户: " + message;

        // 保存对话历史
        Goal updateConv = new Goal();
        updateConv.setId(goal.getId());
        updateConv.setConversation(history);
        goalService.updateParsedResult(goal.getId(), updateConv);

        // 继续解析
        ParseResult result = agentOrchestrator.processOneRound(
                goal.getId(), message, history, userId);

        if (result.isNeedsClarification()) {
            return buildClarifyResponse(goal.getId(), result);
        }

        // 解析完成，自动进入排期
        goalService.updateStatus(goal.getId(), "PARSED");
        PlanVO planVO = planOrchestrator.processPlanRound(goal.getId(), null, userId);
        return buildScheduleCardResponse(goal.getId(), planVO, goal.getParsedTarget());
    }

    private ChatResponseVO handleRefinement(Goal goal, String message, Long userId) {
        PlanVO planVO = planOrchestrator.processPlanRound(goal.getId(), message, userId);
        return buildScheduleCardResponse(goal.getId(), planVO, goal.getParsedTarget());
    }

    // ---- Response builders ----

    private ChatResponseVO buildClarifyResponse(Long goalId, ParseResult result) {
        ChatResponseVO vo = new ChatResponseVO();
        vo.setSessionId(String.valueOf(goalId));
        vo.setType("clarify");
        vo.setText("好的，我需要确认以下几点：");

        List<String> questions = result.getMissingInfo();
        if (questions == null || questions.isEmpty()) {
            questions = List.of("能否提供更多关于目标的具体信息？比如截止时间、涉及的具体事项等。");
        }

        // 格式化追问文本
        StringBuilder sb = new StringBuilder("好的，我需要确认以下几点：\n");
        for (int i = 0; i < questions.size(); i++) {
            sb.append("\n").append(i + 1).append(". ").append(questions.get(i));
        }
        vo.setText(sb.toString());
        vo.setQuestions(questions);
        return vo;
    }

    private ChatResponseVO buildScheduleCardResponse(Long goalId, PlanVO planVO, String goalTitle) {
        ChatResponseVO vo = new ChatResponseVO();
        vo.setSessionId(String.valueOf(goalId));
        vo.setType("schedule_card");

        // Build text summary
        StringBuilder text = new StringBuilder();
        if (goalTitle != null && !goalTitle.isEmpty()) {
            text.append("📋 ").append(goalTitle).append("\n\n");
        }

        if (planVO != null && planVO.getPlanItems() != null && !planVO.getPlanItems().isEmpty()) {
            List<PlanVO.PlanItem> items = planVO.getPlanItems();
            for (int i = 0; i < items.size(); i++) {
                PlanVO.PlanItem item = items.get(i);
                String priorityEmoji = "HIGH".equals(item.getPriority()) ? "🔴" :
                        "LOW".equals(item.getPriority()) ? "🟢" : "🟡";
                text.append("  ")
                        .append(item.getStartTime() != null ? item.getStartTime().substring(5, 10) : "?")
                        .append("  ")
                        .append(item.getTitle())
                        .append("  ").append(priorityEmoji).append("\n");
            }
        }

        // Warnings
        if (planVO != null && planVO.getWarnings() != null && !planVO.getWarnings().isEmpty()) {
            text.append("\n⚠️ 风险提醒：");
            for (String w : planVO.getWarnings()) {
                text.append("\n  - ").append(w);
            }
        }

        text.append("\n\n[ ✅ 确认 ]  [ 🔧 对话调整 ]");
        vo.setText(text.toString());

        // Build schedule data
        if (planVO != null) {
            ChatResponseVO.ScheduleData scheduleData = new ChatResponseVO.ScheduleData();
            scheduleData.setTitle(goalTitle);
            scheduleData.setItems(new ArrayList<>());

            if (planVO.getPlanItems() != null) {
                for (PlanVO.PlanItem pi : planVO.getPlanItems()) {
                    ChatResponseVO.ScheduleItem si = new ChatResponseVO.ScheduleItem();
                    si.setTitle(pi.getTitle());
                    si.setStartTime(pi.getStartTime());
                    si.setEndTime(pi.getEndTime());
                    si.setEstimatedHours(pi.getEstimatedHours());
                    si.setPriority(pi.getPriority());
                    si.setHasConflict(pi.isHasConflict());
                    si.setConflictDetail(pi.getConflictDetail());
                    scheduleData.getItems().add(si);
                }
            }
            vo.setSchedule(scheduleData);

            // Build conflicts
            if (planVO.getWarnings() != null && !planVO.getWarnings().isEmpty()) {
                List<ChatResponseVO.ConflictData> conflicts = new ArrayList<>();
                for (String w : planVO.getWarnings()) {
                    ChatResponseVO.ConflictData cd = new ChatResponseVO.ConflictData();
                    cd.setItem("");
                    cd.setOverlapWith(w);
                    cd.setSuggestion("");
                    conflicts.add(cd);
                }
                vo.setConflicts(conflicts);
            }
        }

        return vo;
    }

    private ChatResponseVO buildTextResponse(Long goalId, String text) {
        ChatResponseVO vo = new ChatResponseVO();
        vo.setSessionId(goalId != null ? String.valueOf(goalId) : null);
        vo.setType("text");
        vo.setText(text);
        return vo;
    }

    private boolean isConfirmMessage(String message) {
        if (message == null) return false;
        String trimmed = message.trim();
        return CONFIRM_PATTERN.matcher(trimmed).matches();
    }
}
