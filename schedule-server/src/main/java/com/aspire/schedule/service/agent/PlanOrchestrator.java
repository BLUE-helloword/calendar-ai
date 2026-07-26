package com.aspire.schedule.service.agent;

import cn.hutool.json.JSONUtil;
import com.aspire.schedule.model.vo.PlanVO;
import com.aspire.schedule.repository.entity.Goal;
import com.aspire.schedule.repository.entity.Schedule;
import com.aspire.schedule.service.GoalService;
import com.aspire.schedule.service.ScheduleService;
import com.aspire.schedule.service.agent.model.PlanResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class PlanOrchestrator {

    private static final int MAX_SCHEDULE_ROUNDS = 3;

    private final SchedulePlanner schedulePlanner;
    private final GoalService goalService;
    private final ScheduleService scheduleService;

    /**
     * 单轮排期处理
     * 由 Controller 调用
     */
    public PlanVO processPlanRound(Long goalId, String userFeedback, Long userId) {
        Goal goal = goalService.findById(goalId);
        if (goal == null) {
            throw new IllegalArgumentException("目标不存在: " + goalId);
        }

        // 检查是否超过最大调度轮数
        int currentRound = goal.getScheduleRound() != null ? goal.getScheduleRound() : 0;
        if (currentRound >= MAX_SCHEDULE_ROUNDS) {
            log.info("Goal {} reached max schedule rounds ({}), returning last plan", goalId, currentRound);
            return buildLastPlan(goalId, goal);
        }

        // 获取已有日程
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime thirtyDaysLater = now.plusDays(30);
        List<Schedule> existingSchedules = scheduleService.findByUserAndRange(userId, now, thirtyDaysLater);
        log.debug("Goal {} schedule planning: {} existing schedules in next 30 days", goalId, existingSchedules.size());

        String deadline = goal.getParsedDeadline() != null
                ? goal.getParsedDeadline().toString()
                : null;

        // 调用排期 Agent
        long planStart = System.currentTimeMillis();
        PlanResult result = schedulePlanner.plan(
                goal.getParsedItems(), deadline, existingSchedules, userFeedback);

        // 更新轮次
        goalService.incrementScheduleRound(goalId);
        long planLatency = System.currentTimeMillis() - planStart;
        log.info("Goal {} schedule planning done: planItems={}, latency={}ms", goalId,
                result != null && result.getPlan() != null ? result.getPlan().size() : 0, planLatency);
        currentRound++;

        // 保存排期结果到 Goal.partialResult
        goalService.savePartialResult(goalId, JSONUtil.toJsonStr(result));

        // 如果首次生成，更新状态为 PLANNED
        if ("CONFIRMED".equals(goal.getStatus())) {
            goalService.updateStatus(goalId, "PLANNED");
        }

        // 构建存储的排期上下文（供后续轮次回溯）
        StringBuilder planContext = goal.getConversation() != null
                ? new StringBuilder(goal.getConversation()) : new StringBuilder();
        if (userFeedback != null && !userFeedback.isEmpty()) {
            planContext.append("\n用户反馈: ").append(userFeedback);
        }
        planContext.append("\nAI排期方案: ").append(JSONUtil.toJsonStr(result.getPlan()));
        goalService.saveConversation(goalId, planContext.toString());

        // 构建返回 VO
        return toPlanVO(goalId, goal.getParsedTarget(), result, currentRound);
    }

    /**
     * 最后一轮：返回已有的排期结果
     */
    private PlanVO buildLastPlan(Long goalId, Goal goal) {
        try {
            PlanResult result = JSONUtil.toBean(goal.getPartialResult(), PlanResult.class);
            int round = goal.getScheduleRound() != null ? goal.getScheduleRound() : 0;
            return toPlanVO(goalId, goal.getParsedTarget(), result, round);
        } catch (Exception e) {
            log.warn("Failed to parse saved plan result for goal {}", goalId);
            return null;
        }
    }

    private PlanVO toPlanVO(Long goalId, String parsedTarget, PlanResult result, int currentRound) {
        PlanVO vo = new PlanVO();
        vo.setGoalId(goalId);
        vo.setParsedTarget(parsedTarget);
        vo.setCurrentScheduleRound(currentRound);
        vo.setMaxScheduleRounds(MAX_SCHEDULE_ROUNDS);

        List<PlanVO.PlanItem> items = new ArrayList<>();
        if (result != null && result.getPlan() != null) {
            for (PlanResult.PlanItem pi : result.getPlan()) {
                PlanVO.PlanItem item = new PlanVO.PlanItem();
                item.setTitle(pi.getTaskTitle());
                item.setStartTime(pi.getSuggestedStart());
                item.setEndTime(pi.getSuggestedEnd());
                item.setEstimatedHours(pi.getEstimatedHours());
                item.setPriority(pi.getPriority() != null ? pi.getPriority() : "MEDIUM");
                item.setHasConflict(pi.isHasConflict());
                item.setConflictDetail(pi.getConflictDetail() != null ? pi.getConflictDetail() : "");
                items.add(item);
            }
        }
        vo.setPlanItems(items);

        if (result != null && result.getWarnings() != null) {
            vo.setWarnings(result.getWarnings());
        }

        log.info("PlanOrchestrator round {} for goal {}: {} plan items, {} warnings",
                currentRound, goalId, items.size(),
                result != null && result.getWarnings() != null ? result.getWarnings().size() : 0);

        return vo;
    }
}
