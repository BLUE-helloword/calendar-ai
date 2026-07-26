package com.aspire.schedule.service.agent;

import cn.hutool.json.JSONUtil;
import com.aspire.schedule.service.GoalService;
import com.aspire.schedule.service.agent.model.ParseResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AgentOrchestrator {

    private static final double CONFIDENCE_THRESHOLD = 0.8;
    private static final int MAX_CLARIFY_ROUNDS = 5;

    private final IntentParser intentParser;
    private final ExecutionTracker executionTracker;
    private final GoalService goalService;

    /**
     * 单轮意图解析
     * 由 Controller 每次收到用户消息时调用
     */
    public ParseResult processOneRound(Long goalId, String userInput,
                                        String conversationHistory, Long userId) {
        // 1. 检查是否超过最大追问轮数
        int currentRound = goalService.getClarifyRound(goalId);
        if (currentRound >= MAX_CLARIFY_ROUNDS) {
            log.info("Goal {} reached max clarify rounds ({}), forcing completion", goalId, currentRound);
            ParseResult result = intentParser.parse(userInput, conversationHistory);
            saveAndComplete(goalId, result, userId);
            return ParseResult.completed(goalId, result);
        }

        // 2. 意图解析
        String sessionId = executionTracker.createSession();
        ParseResult result = intentParser.parse(userInput, conversationHistory);
        log.info("Agent parse round {}: userInput={}, confidence={}, missingInfo={}",
                currentRound + 1, userInput, result.getConfidence(), result.getMissingInfo());

        // 3. 检查是否为 API 错误（不可恢复，不要进入追问循环）
        if (result.getConfidence() == 0.0
                && result.getMissingInfo() != null
                && !result.getMissingInfo().isEmpty()
                && result.getMissingInfo().get(0).contains("AI 服务暂时不可用")) {
            log.warn("Goal {} API unavailable, returning error directly", goalId);
            return ParseResult.needsClarification(goalId, result, result.getMissingInfo());
        }

        // 4. 检查是否需要追问
        boolean needsClarification =
                result.getConfidence() < CONFIDENCE_THRESHOLD
                || (result.getMissingInfo() != null && !result.getMissingInfo().isEmpty())
                || result.getParsedDeadline() == null;

        if (needsClarification) {
            goalService.updateStatus(goalId, "CLARIFYING");
            goalService.incrementRound(goalId);
            goalService.savePartialResult(goalId, JSONUtil.toJsonStr(result));

            List<String> questions = result.getMissingInfo();
            if (questions == null || questions.isEmpty()) {
                questions = List.of("能否提供更多关于目标的具体信息？比如截止时间、涉及的具体事项等。");
            }

            log.info("Goal {} needs clarification, round={}, confidence={}, questions={}",
                    goalId, currentRound + 1, result.getConfidence(), questions);
            return ParseResult.needsClarification(goalId, result, questions);
        }

        // 4. 信息达标
        saveAndComplete(goalId, result, userId);
        log.info("Goal {} parse complete, confidence={}", goalId, result.getConfidence());
        return ParseResult.completed(goalId, result);
    }

    private void saveAndComplete(Long goalId, ParseResult result, Long userId) {
        goalService.updateStatus(goalId, "PARSED");
    }
}
