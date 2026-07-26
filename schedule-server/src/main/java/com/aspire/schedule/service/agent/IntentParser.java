package com.aspire.schedule.service.agent;

import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.aspire.schedule.service.PromptTemplateService;
import com.aspire.schedule.service.agent.model.LLMResponse;
import com.aspire.schedule.service.agent.model.ParseResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class IntentParser {

    private final LLMClient llmClient;
    private final PromptTemplateService promptTemplateService;

    /**
     * 解析用户自然语言输入
     */
    public ParseResult parse(String userInput, String conversationHistory) {
        // 获取 Prompt 模板
        String systemPrompt = getSystemPrompt();

        // 构建用户消息（含历史对话上下文）
        StringBuilder userMessage = new StringBuilder();
        userMessage.append("当前日期：").append(java.time.LocalDate.now()).append("\n\n");
        if (conversationHistory != null && !conversationHistory.isEmpty()) {
            userMessage.append("对话历史：\n").append(conversationHistory).append("\n\n");
        }
        userMessage.append("用户输入：").append(userInput);

        // 调用 LLM
        LLMResponse response = llmClient.chat(systemPrompt, userMessage.toString());

        if (!response.isSuccess()) {
            log.warn("Intent parse failed: {}", response.getErrorMsg());
            ParseResult fallback = new ParseResult();
            fallback.setConfidence(0.0);
            fallback.getMissingInfo().add("AI 服务暂时不可用（LLM API 调用失败），请检查 API Key 配置是否正确。错误信息: " + response.getErrorMsg());
            return fallback;
        }

        // 解析 JSON 响应
        return parseLLMResponse(response.getContent());
    }

    private ParseResult parseLLMResponse(String content) {
        try {
            // 提取 JSON（LLM 可能返回带 markdown 标记的 JSON）
            String json = content.trim();
            if (json.startsWith("```")) {
                json = json.replaceAll("```json|```", "").trim();
            }

            JSONObject obj = JSONUtil.parseObj(json);
            ParseResult result = new ParseResult();
            result.setParsedTarget(obj.getStr("parsedTarget"));
            result.setParsedDeadline(obj.getStr("parsedDeadline"));
            result.setParsedItems(obj.getStr("parsedItems", "[]"));
            result.setConfidence(obj.getDouble("confidence", 0.0));

            if (obj.containsKey("missingInfo")) {
                result.setMissingInfo(obj.getBeanList("missingInfo", String.class));
            }

            return result;
        } catch (Exception e) {
            log.error("Failed to parse LLM response: {}", content, e);
            ParseResult fallback = new ParseResult();
            fallback.setConfidence(0.0);
            return fallback;
        }
    }

    private String getSystemPrompt() {
        var template = promptTemplateService.findByAgentTypeAndStatus("INTENT_PARSE");
        if (template != null) {
            return template.getContent();
        }
        // 默认 Prompt
        return "你是一个任务解析专家。从用户的自然语言输入中提取目标、截止时间、子事项等信息。"
                + "如果信息不完整，在 missingInfo 中列出需要追问的问题。"
                + "输出格式为 JSON。";
    }
}
