package com.aspire.schedule.controller;

import com.aspire.schedule.common.response.ApiResponse;
import com.aspire.schedule.model.dto.ChatConfirmDTO;
import com.aspire.schedule.model.dto.ChatRequestDTO;
import com.aspire.schedule.model.dto.PlanConfirmDTO;
import com.aspire.schedule.model.vo.ChatResponseVO;
import com.aspire.schedule.repository.entity.Reminder;
import com.aspire.schedule.repository.entity.Schedule;
import com.aspire.schedule.repository.entity.Task;
import com.aspire.schedule.security.JwtTokenProvider;
import com.aspire.schedule.service.ReminderService;
import com.aspire.schedule.service.ScheduleService;
import com.aspire.schedule.service.TaskService;
import com.aspire.schedule.service.agent.ChatOrchestrator;
import lombok.extern.slf4j.Slf4j;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Tag(name = "AI 对话")
@Slf4j
@RestController
@RequestMapping("/api/v1/chat")
@RequiredArgsConstructor
public class ChatController {

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private static final DateTimeFormatter ISO_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");

    private LocalDateTime parseTime(String timeStr) {
        if (timeStr == null || timeStr.isEmpty()) {
            throw new IllegalArgumentException("时间不能为空");
        }
        // 兼容 ISO 格式 (yyyy-MM-ddTHH:mm:ss) 和空格格式 (yyyy-MM-dd HH:mm:ss)
        if (timeStr.contains("T")) {
            return LocalDateTime.parse(timeStr, ISO_FORMATTER);
        }
        return LocalDateTime.parse(timeStr, FORMATTER);
    }

    private final JwtTokenProvider jwtTokenProvider;
    private final ChatOrchestrator chatOrchestrator;
    private final TaskService taskService;
    private final ScheduleService scheduleService;
    private final ReminderService reminderService;

    private Long getUserId(HttpServletRequest request) {
        String token = request.getHeader("Authorization");
        if (StringUtils.hasText(token) && token.startsWith("Bearer ")) {
            token = token.substring(7);
            return jwtTokenProvider.getUserIdFromToken(token);
        }
        throw new RuntimeException("未认证");
    }

    @Operation(summary = "发送消息（统一对话接口）")
    @PostMapping("/message")
    public ApiResponse<ChatResponseVO> sendMessage(@RequestBody @Valid ChatRequestDTO dto,
                                                    HttpServletRequest request) {
        Long userId = getUserId(request);
        long msgStart = System.currentTimeMillis();
        ChatResponseVO response = chatOrchestrator.processMessage(
                dto.getSessionId(), dto.getMessage(), userId);
        log.info("Chat message processed: sessionId={}, type={}, latency={}ms",
                dto.getSessionId() != null ? dto.getSessionId() : "new",
                response.getType(), System.currentTimeMillis() - msgStart);
        return ApiResponse.ok(response);
    }

    @Operation(summary = "确认排期（批量创建任务/日程/提醒）")
    @PostMapping("/confirm")
    public ApiResponse<ChatResponseVO> confirm(@RequestBody @Valid ChatConfirmDTO dto,
                                                HttpServletRequest request) {
        Long userId = getUserId(request);

        // 按标题归并：同名项合并为一个 Task，多个 Schedule
        var grouped = new java.util.LinkedHashMap<String, java.util.List<PlanConfirmDTO.PlanItemInput>>();
        for (PlanConfirmDTO.PlanItemInput item : dto.getItems()) {
            String key = item.getTitle().trim();
            grouped.computeIfAbsent(key, k -> new java.util.ArrayList<>()).add(item);
        }

        int taskCount = 0, scheduleCount = 0, reminderCount = 0;

        for (var entry : grouped.entrySet()) {
            String title = entry.getKey();
            var items = entry.getValue();

            // 该任务的整体时间范围取所有时间片的最早开始和最晚结束
            LocalDateTime overallStart = null;
            LocalDateTime overallEnd = null;
            String priority = "MEDIUM";

            for (PlanConfirmDTO.PlanItemInput item : items) {
                LocalDateTime st = parseTime(item.getStartTime());
                LocalDateTime et = parseTime(item.getEndTime());
                if (overallStart == null || st.isBefore(overallStart)) overallStart = st;
                if (overallEnd == null || et.isAfter(overallEnd)) overallEnd = et;
                if (item.getPriority() != null) priority = item.getPriority();
            }

            // 创建一个 Task 覆盖所有时间片
            Task task = new Task();
            task.setUserId(userId);
            task.setTitle(title);
            task.setPriority(priorityToInt(priority));
            task.setStatus("TODO");
            task.setStartTime(overallStart);
            task.setEndTime(overallEnd);
            task.setSourceType("AI_GENERATED");
            taskService.create(task);
            taskCount++;

            // 每个时间片创建一个 Schedule + Reminder
            for (PlanConfirmDTO.PlanItemInput item : items) {
                LocalDateTime startTime = parseTime(item.getStartTime());
                LocalDateTime endTime = parseTime(item.getEndTime());

                Schedule schedule = new Schedule();
                schedule.setUserId(userId);
                schedule.setTaskId(task.getId());
                schedule.setTitle(title);
                schedule.setStartTime(startTime);
                schedule.setEndTime(endTime);
                schedule.setIsAllDay(0);
                schedule.setStatus("ACTIVE");
                scheduleService.create(schedule);
                scheduleCount++;

                Reminder reminder = new Reminder();
                reminder.setUserId(userId);
                reminder.setTaskId(task.getId());
                reminder.setRemindTime(startTime.minusMinutes(30));
                reminder.setRemindType("ONCE");
                reminder.setChannel("IN_APP");
                reminder.setMessage("任务「" + title + "」将在30分钟后开始");
                reminder.setStatus("PENDING");
                reminderService.create(reminder);
                reminderCount++;
            }
        }

        log.info("Schedule confirmed: sessionId={}, tasks={}, schedules={}, reminders={}",
                dto.getSessionId(), taskCount, scheduleCount, reminderCount);

        ChatResponseVO vo = new ChatResponseVO();
        vo.setSessionId(dto.getSessionId());
        vo.setType("task_created");
        vo.setText(String.format("已创建 %d 个任务、%d 个日程和 %d 个提醒 ✅", taskCount, scheduleCount, reminderCount));

        ChatResponseVO.TaskCreatedData tcd = new ChatResponseVO.TaskCreatedData();
        tcd.setCreatedTasks(taskCount);
        tcd.setCreatedSchedules(scheduleCount);
        tcd.setCreatedReminders(reminderCount);
        vo.setTaskCreated(tcd);

        return ApiResponse.ok(vo);
    }

    private int priorityToInt(String priority) {
        if (priority == null) return 2;
        return switch (priority.toUpperCase()) {
            case "HIGH" -> 1;
            case "LOW" -> 3;
            default -> 2;
        };
    }
}
