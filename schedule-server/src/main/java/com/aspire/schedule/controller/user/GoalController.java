package com.aspire.schedule.controller.user;

import com.aspire.schedule.common.response.ApiResponse;
import com.aspire.schedule.model.dto.GoalParseDTO;
import com.aspire.schedule.model.dto.GoalReplyDTO;
import com.aspire.schedule.model.vo.GoalParseVO;
import com.aspire.schedule.repository.entity.Goal;
import com.aspire.schedule.security.JwtTokenProvider;
import com.aspire.schedule.service.GoalService;
import com.aspire.schedule.service.agent.AgentOrchestrator;
import com.aspire.schedule.service.agent.model.ParseResult;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

@Tag(name = "目标管理")
@RestController
@RequestMapping("/api/v1/goals")
@RequiredArgsConstructor
public class GoalController {

    private final GoalService goalService;
    private final AgentOrchestrator agentOrchestrator;
    private final JwtTokenProvider jwtTokenProvider;

    private Long getUserId(HttpServletRequest request) {
        String token = request.getHeader("Authorization");
        if (StringUtils.hasText(token) && token.startsWith("Bearer ")) {
            token = token.substring(7);
            return jwtTokenProvider.getUserIdFromToken(token);
        }
        throw new RuntimeException("未认证");
    }

    @Operation(summary = "提交自然语言目标")
    @PostMapping("/parse")
    public ApiResponse<GoalParseVO> parse(@RequestBody @Valid GoalParseDTO dto,
                                           HttpServletRequest request) {
        Long userId = getUserId(request);

        // 创建 goal
        Goal goal = goalService.create(userId, dto.getRawInput());

        // Agent 解析
        ParseResult result = agentOrchestrator.processOneRound(
                goal.getId(), dto.getRawInput(), null, userId);

        return ApiResponse.ok(toVO(goal.getId(), result));
    }

    @Operation(summary = "获取解析结果")
    @GetMapping("/{id}/result")
    public ApiResponse<GoalParseVO> getResult(@PathVariable Long id) {
        Goal goal = goalService.findById(id);
        if (goal == null) {
            return ApiResponse.fail(404, "目标不存在");
        }

        GoalParseVO vo = new GoalParseVO();
        vo.setGoalId(id);
        vo.setStatus(goal.getStatus());
        vo.setParsedTarget(goal.getParsedTarget());
        vo.setCurrentRound(goal.getClarifyRound());
        return ApiResponse.ok(vo);
    }

    @Operation(summary = "回复Agent追问")
    @PostMapping("/{id}/reply")
    public ApiResponse<GoalParseVO> reply(@PathVariable Long id,
                                           @RequestBody @Valid GoalReplyDTO dto,
                                           HttpServletRequest request) {
        Long userId = getUserId(request);

        Goal goal = goalService.findById(id);
        if (goal == null) {
            return ApiResponse.fail(404, "目标不存在");
        }

        // 构建对话历史
        String history = goal.getConversation();
        if (history == null) {
            history = "用户: " + goal.getRawInput();
        }
        history += "\n用户: " + dto.getReply();

        // 保存对话历史
        Goal updateConv = new Goal();
        updateConv.setId(id);
        updateConv.setConversation(history);
        goalService.updateParsedResult(id, updateConv);

        // Agent 再解析
        ParseResult result = agentOrchestrator.processOneRound(
                id, dto.getReply(), history, userId);

        return ApiResponse.ok(toVO(id, result));
    }

    @Operation(summary = "确认解析结果")
    @PutMapping("/{id}/confirm")
    public ApiResponse<GoalParseVO> confirm(@PathVariable Long id) {
        Goal goal = goalService.findById(id);
        if (goal == null) {
            return ApiResponse.fail(404, "目标不存在");
        }

        goalService.updateStatus(id, "CONFIRMED");

        GoalParseVO vo = new GoalParseVO();
        vo.setGoalId(id);
        vo.setStatus("CONFIRMED");
        vo.setParsedTarget(goal.getParsedTarget());
        vo.setParsedDeadline(goal.getParsedDeadline() != null
                ? goal.getParsedDeadline().toString() : null);
        return ApiResponse.ok(vo);
    }

    private GoalParseVO toVO(Long goalId, ParseResult result) {
        GoalParseVO vo = new GoalParseVO();
        vo.setGoalId(goalId);
        vo.setStatus(result.isNeedsClarification() ? "CLARIFYING" : "PARSED");
        vo.setParsedTarget(result.getParsedTarget());
        vo.setParsedDeadline(result.getParsedDeadline());
        vo.setConfidence(result.getConfidence());
        vo.setNeedsClarification(result.isNeedsClarification());
        vo.setQuestions(result.getMissingInfo());
        vo.setCurrentRound(goalService.getClarifyRound(goalId));
        return vo;
    }
}
