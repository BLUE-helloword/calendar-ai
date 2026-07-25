package com.aspire.schedule.controller.user;

import com.aspire.schedule.common.response.ApiResponse;
import com.aspire.schedule.model.vo.DashboardVO;
import com.aspire.schedule.model.vo.ReportVO;
import com.aspire.schedule.repository.entity.Schedule;
import com.aspire.schedule.repository.entity.Task;
import com.aspire.schedule.security.JwtTokenProvider;
import com.aspire.schedule.service.ScheduleService;
import com.aspire.schedule.service.TaskService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

@Tag(name = "首页总览")
@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final TaskService taskService;
    private final ScheduleService scheduleService;
    private final JwtTokenProvider jwtTokenProvider;

    private Long getUserId(HttpServletRequest request) {
        String token = request.getHeader("Authorization");
        if (StringUtils.hasText(token) && token.startsWith("Bearer ")) {
            token = token.substring(7);
            return jwtTokenProvider.getUserIdFromToken(token);
        }
        throw new RuntimeException("未认证");
    }

    @Operation(summary = "首页总览")
    @GetMapping
    public ApiResponse<DashboardVO> overview(HttpServletRequest request) {
        Long userId = getUserId(request);

        List<Task> allTasks = taskService.findByUserId(userId, null, null);
        List<Schedule> allSchedules = scheduleService.findByUserId(userId);

        LocalDate today = LocalDate.now();
        LocalDateTime todayStart = today.atStartOfDay();
        LocalDateTime todayEnd = today.atTime(LocalTime.MAX);
        LocalDateTime sevenDaysLater = todayEnd.plusDays(7);

        DashboardVO vo = new DashboardVO();

        // 今日任务
        List<Task> todayTasks = allTasks.stream()
                .filter(t -> t.getStartTime() != null
                        && !t.getStartTime().isBefore(todayStart)
                        && t.getStartTime().isBefore(today.plusDays(1).atStartOfDay()))
                .collect(Collectors.toList());
        vo.setTodayTasks(todayTasks);

        // 未来7天任务
        List<Task> upcomingTasks = allTasks.stream()
                .filter(t -> t.getStartTime() != null
                        && !t.getStartTime().isBefore(todayStart)
                        && t.getStartTime().isBefore(sevenDaysLater))
                .collect(Collectors.toList());
        vo.setUpcomingTasks(upcomingTasks);

        // 今日日程
        List<Schedule> todaySchedules = allSchedules.stream()
                .filter(s -> s.getStartTime() != null
                        && !s.getStartTime().isBefore(todayStart)
                        && s.getStartTime().isBefore(today.plusDays(1).atStartOfDay()))
                .collect(Collectors.toList());
        vo.setTodaySchedules(todaySchedules);

        // 统计
        vo.setTotalTasks(allTasks.size());
        vo.setCompletedTasks((int) allTasks.stream()
                .filter(t -> "DONE".equals(t.getStatus())).count());
        vo.setDelayedTasks((int) allTasks.stream()
                .filter(t -> t.getEndTime() != null
                        && t.getEndTime().isBefore(LocalDateTime.now())
                        && !"DONE".equals(t.getStatus()))
                .count());

        // 高优先级任务
        List<Task> highPriorityTasks = allTasks.stream()
                .filter(t -> t.getPriority() != null && t.getPriority() == 1
                        && !"DONE".equals(t.getStatus()))
                .collect(Collectors.toList());
        vo.setHighPriorityTasks(highPriorityTasks);

        return ApiResponse.ok(vo);
    }

    @Operation(summary = "周报")
    @GetMapping("/report")
    public ApiResponse<ReportVO> report(@RequestParam(defaultValue = "7") int days,
                                         HttpServletRequest request) {
        Long userId = getUserId(request);

        LocalDateTime start = LocalDateTime.now().minusDays(days);
        LocalDateTime end = LocalDateTime.now();

        List<Task> completedTasks = taskService.findCompletedInRange(userId, start, end);
        List<Task> allTasks = taskService.findByUserId(userId, null, null);

        ReportVO vo = new ReportVO();
        vo.setCompletedTasks(completedTasks);
        vo.setCompletedCount(completedTasks.size());
        vo.setTotalCount(allTasks.size());
        vo.setPeriod("最近" + days + "天");

        return ApiResponse.ok(vo);
    }
}
