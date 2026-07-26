package com.aspire.schedule.controller.user;

import cn.hutool.json.JSONArray;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.aspire.schedule.common.response.ApiResponse;
import com.aspire.schedule.model.dto.PlanConfirmDTO;
import com.aspire.schedule.model.dto.PlanRefineDTO;
import com.aspire.schedule.model.vo.PlanVO;
import com.aspire.schedule.repository.entity.Goal;
import com.aspire.schedule.repository.entity.Reminder;
import com.aspire.schedule.repository.entity.Schedule;
import com.aspire.schedule.repository.entity.Task;
import com.aspire.schedule.security.JwtTokenProvider;
import com.aspire.schedule.service.GoalService;
import com.aspire.schedule.service.ReminderService;
import com.aspire.schedule.service.ScheduleService;
import com.aspire.schedule.service.TaskService;
import com.aspire.schedule.service.agent.PlanOrchestrator;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Tag(name = "排期管理")
@RestController
@RequestMapping("/api/v1/goals")
@RequiredArgsConstructor
public class PlanController {

    private final JwtTokenProvider jwtTokenProvider;
    private final TaskService taskService;
    private final ScheduleService scheduleService;
    private final ReminderService reminderService;
    private final GoalService goalService;
    private final PlanOrchestrator planOrchestrator;

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private Long getUserId(HttpServletRequest request) {
        String token = request.getHeader("Authorization");
        if (StringUtils.hasText(token) && token.startsWith("Bearer ")) {
            token = token.substring(7);
            return jwtTokenProvider.getUserIdFromToken(token);
        }
        throw new RuntimeException("未认证");
    }

    @Operation(summary = "生成排期计划")
    @PostMapping("/{id}/plan/generate")
    public ApiResponse<PlanVO> generate(@PathVariable Long id, HttpServletRequest request) {
        Long userId = getUserId(request);
        return ApiResponse.ok(buildPlan(id, userId));
    }

    @Operation(summary = "预览排期计划")
    @GetMapping("/{id}/plan/preview")
    public ApiResponse<PlanVO> preview(@PathVariable Long id, HttpServletRequest request) {
        Long userId = getUserId(request);
        return ApiResponse.ok(buildPlan(id, userId));
    }

    @Operation(summary = "AI智能排期（首次调用）")
    @PostMapping("/{id}/plan/optimize")
    public ApiResponse<PlanVO> optimize(@PathVariable Long id, HttpServletRequest request) {
        Long userId = getUserId(request);
        PlanVO vo = planOrchestrator.processPlanRound(id, null, userId);
        return ApiResponse.ok(vo);
    }

    @Operation(summary = "排期多轮调整（用户反馈）")
    @PostMapping("/{id}/plan/refine")
    public ApiResponse<PlanVO> refine(@PathVariable Long id,
                                       @RequestBody @Valid PlanRefineDTO dto,
                                       HttpServletRequest request) {
        Long userId = getUserId(request);
        PlanVO vo = planOrchestrator.processPlanRound(id, dto.getFeedback(), userId);
        return ApiResponse.ok(vo);
    }

    @Operation(summary = "查看排期状态")
    @GetMapping("/{id}/plan/plan-status")
    public ApiResponse<PlanVO> planStatus(@PathVariable Long id) {
        Goal goal = goalService.findById(id);
        if (goal == null) {
            return ApiResponse.fail(404, "目标不存在");
        }
        // 返回已有排期（从 partialResult 读取）
        PlanVO vo = new PlanVO();
        vo.setGoalId(id);
        vo.setParsedTarget(goal.getParsedTarget());
        vo.setCurrentScheduleRound(goal.getScheduleRound() != null ? goal.getScheduleRound() : 0);
        return ApiResponse.ok(vo);
    }

    @Operation(summary = "确认排期计划")
    @PostMapping("/{id}/plan/confirm")
    public ApiResponse<Void> confirm(@PathVariable Long id,
                                      @RequestBody @Valid PlanConfirmDTO dto,
                                      HttpServletRequest request) {
        Long userId = getUserId(request);

        for (PlanConfirmDTO.PlanItemInput item : dto.getItems()) {
            LocalDateTime startTime = LocalDateTime.parse(item.getStartTime(), FORMATTER);
            LocalDateTime endTime = LocalDateTime.parse(item.getEndTime(), FORMATTER);
            String priority = item.getPriority() != null ? item.getPriority() : "MEDIUM";

            // 创建 Task
            Task task = new Task();
            task.setGoalId(id);
            task.setUserId(userId);
            task.setTitle(item.getTitle());
            task.setPriority(priorityToInt(priority));
            task.setStatus("PENDING");
            task.setStartTime(startTime);
            task.setEndTime(endTime);
            taskService.create(task);

            // 创建 Schedule
            Schedule schedule = new Schedule();
            schedule.setUserId(userId);
            schedule.setTaskId(task.getId());
            schedule.setTitle(item.getTitle());
            schedule.setStartTime(startTime);
            schedule.setEndTime(endTime);
            schedule.setIsAllDay(0);
            schedule.setStatus("ACTIVE");
            scheduleService.create(schedule);

            // 创建 Reminder（提前30分钟提醒）
            Reminder reminder = new Reminder();
            reminder.setUserId(userId);
            reminder.setTaskId(task.getId());
            reminder.setRemindTime(startTime.minusMinutes(30));
            reminder.setRemindType("BEFORE");
            reminder.setChannel("SYSTEM");
            reminder.setMessage("任务「" + item.getTitle() + "」将在30分钟后开始");
            reminder.setStatus("PENDING");
            reminderService.create(reminder);
        }

        return ApiResponse.ok();
    }

    private PlanVO buildPlan(Long goalId, Long userId) {
        Goal goal = goalService.findById(goalId);
        if (goal == null) {
            return null;
        }

        // 获取用户未来30天的已有排期
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime thirtyDaysLater = now.plusDays(30);
        List<Schedule> existingSchedules = scheduleService.findByUserAndRange(userId, now, thirtyDaysLater);

        PlanVO vo = new PlanVO();
        vo.setGoalId(goalId);
        vo.setParsedTarget(goal.getParsedTarget());

        List<PlanVO.PlanItem> items = new ArrayList<>();
        if (StringUtils.hasText(goal.getParsedItems())) {
            try {
                JSONArray jsonArray = JSONUtil.parseArray(goal.getParsedItems());
                for (int i = 0; i < jsonArray.size(); i++) {
                    JSONObject obj = jsonArray.getJSONObject(i);
                    PlanVO.PlanItem item = new PlanVO.PlanItem();
                    item.setTitle(obj.getStr("taskTitle", obj.getStr("name", "")));
                    item.setStartTime(obj.getStr("suggestedStart", ""));
                    item.setEndTime(obj.getStr("suggestedEnd", ""));
                    item.setEstimatedHours(obj.getDouble("estimatedHours", 0.0));
                    item.setPriority(obj.getStr("priority", "MEDIUM"));
                    item.setHasConflict(obj.getBool("hasConflict", false));
                    item.setConflictDetail(obj.getStr("conflictDetail", ""));

                    // 检查与已有排期的时间冲突
                    if (StringUtils.hasText(item.getStartTime()) && StringUtils.hasText(item.getEndTime())) {
                        try {
                            LocalDateTime itemStart = LocalDateTime.parse(item.getStartTime(), FORMATTER);
                            LocalDateTime itemEnd = LocalDateTime.parse(item.getEndTime(), FORMATTER);
                            for (Schedule schedule : existingSchedules) {
                                if (itemStart.isBefore(schedule.getEndTime())
                                        && itemEnd.isAfter(schedule.getStartTime())) {
                                    item.setHasConflict(true);
                                    String detail = item.getConflictDetail();
                                    if (detail == null || detail.isEmpty()) {
                                        detail = "";
                                    }
                                    if (!detail.isEmpty()) {
                                        detail += "; ";
                                    }
                                    detail += "与「" + schedule.getTitle() + "」时间冲突（"
                                            + schedule.getStartTime().format(FORMATTER)
                                            + " ~ " + schedule.getEndTime().format(FORMATTER) + "）";
                                    item.setConflictDetail(detail);
                                }
                            }
                        } catch (Exception ignored) {
                            // 时间解析失败，跳过冲突检测
                        }
                    }

                    items.add(item);
                }
            } catch (Exception e) {
                // parsedItems 解析失败，返回空列表
            }
        }

        vo.setPlanItems(items);
        return vo;
    }

    private int priorityToInt(String priority) {
        if (priority == null) {
            return 2;
        }
        return switch (priority.toUpperCase()) {
            case "HIGH" -> 1;
            case "LOW" -> 3;
            default -> 2;
        };
    }
}
