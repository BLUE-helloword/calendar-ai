package com.aspire.schedule.controller.user;

import com.aspire.schedule.common.response.ApiResponse;
import com.aspire.schedule.model.vo.WeekScheduleVO;
import com.aspire.schedule.repository.entity.Schedule;
import com.aspire.schedule.repository.entity.Task;
import com.aspire.schedule.security.JwtTokenProvider;
import com.aspire.schedule.service.ScheduleService;
import com.aspire.schedule.service.TaskService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Tag(name = "日程周历")
@Slf4j
@RestController
@RequestMapping("/api/v1/schedules")
@RequiredArgsConstructor
public class ScheduleController {

    private final ScheduleService scheduleService;
    private final TaskService taskService;
    private final JwtTokenProvider jwtTokenProvider;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final DateTimeFormatter DATETIME_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private static final String[] WEEKDAY_NAMES = {"周一", "周二", "周三", "周四", "周五", "周六", "周日"};

    private Long getUserId(HttpServletRequest request) {
        String token = request.getHeader("Authorization");
        if (StringUtils.hasText(token) && token.startsWith("Bearer ")) {
            token = token.substring(7);
            return jwtTokenProvider.getUserIdFromToken(token);
        }
        throw new RuntimeException("未认证");
    }

    @Operation(summary = "获取周历日程")
    @GetMapping("/week")
    public ApiResponse<WeekScheduleVO> weekView(@RequestParam(required = false) String date,
                                                 HttpServletRequest request) {
        Long userId = getUserId(request);

        // 解析目标日期，默认今天
        LocalDate targetDate;
        try {
            targetDate = (date != null && !date.isEmpty())
                    ? LocalDate.parse(date, DATE_FMT) : LocalDate.now();
        } catch (Exception e) {
            targetDate = LocalDate.now();
        }

        // 计算周一起止
        LocalDate monday = targetDate.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate sunday = monday.plusDays(6);
        LocalDateTime weekStart = monday.atStartOfDay();
        LocalDateTime weekEnd = sunday.plusDays(1).atStartOfDay();

        // 查询日程和任务
        List<Schedule> schedules = scheduleService.findByUserAndRange(userId, weekStart, weekEnd);
        List<Task> tasks = taskService.findByUserAndTimeRange(userId, weekStart, weekEnd);

        // 构建 VO
        WeekScheduleVO vo = new WeekScheduleVO();
        vo.setWeekStart(monday.format(DATE_FMT));
        vo.setWeekEnd(sunday.format(DATE_FMT));

        List<WeekScheduleVO.DaySchedule> days = new ArrayList<>();
        for (int i = 0; i < 7; i++) {
            LocalDate day = monday.plusDays(i);

            WeekScheduleVO.DaySchedule daySchedule = new WeekScheduleVO.DaySchedule();
            daySchedule.setDate(day.format(DATE_FMT));
            daySchedule.setDayOfWeek(WEEKDAY_NAMES[i]);

            List<WeekScheduleVO.CalendarItem> items = new ArrayList<>();

            // 该日的日程
            for (Schedule s : schedules) {
                if (isSameDay(s.getStartTime(), day)) {
                    WeekScheduleVO.CalendarItem item = new WeekScheduleVO.CalendarItem();
                    item.setId(s.getId());
                    item.setType("SCHEDULE");
                    item.setTitle(s.getTitle());
                    item.setStartTime(s.getStartTime().format(DATETIME_FMT));
                    item.setEndTime(s.getEndTime().format(DATETIME_FMT));
                    item.setColor(s.getColor() != null ? s.getColor() : "#1677ff");
                    item.setStatus(s.getStatus());
                    item.setTaskId(s.getTaskId());
                    items.add(item);
                }
            }

            // 收集本日 schedule 关联的 taskId，用于去重
            java.util.Set<Long> scheduleTaskIds = new java.util.HashSet<>();
            for (Schedule s : schedules) {
                if (isSameDay(s.getStartTime(), day) && s.getTaskId() != null) {
                    scheduleTaskIds.add(s.getTaskId());
                }
            }

            // 该日的任务（跳过已有对应 Schedule 的，避免重复）
            for (Task t : tasks) {
                if (isSameDay(t.getStartTime(), day) && !scheduleTaskIds.contains(t.getId())) {
                    WeekScheduleVO.CalendarItem item = new WeekScheduleVO.CalendarItem();
                    item.setId(t.getId());
                    item.setType("TASK");
                    item.setTitle(t.getTitle());
                    item.setStartTime(t.getStartTime().format(DATETIME_FMT));
                    item.setEndTime(t.getEndTime() != null ? t.getEndTime().format(DATETIME_FMT) : "");
                    // 按优先级分配颜色
                    if (t.getPriority() != null) {
                        item.setColor(t.getPriority() == 1 ? "#f5222d" : t.getPriority() == 2 ? "#fa8c16" : "#52c41a");
                    } else {
                        item.setColor("#1677ff");
                    }
                    item.setStatus(t.getStatus());
                    item.setPriority(t.getPriority());
                    items.add(item);
                }
            }

            // 按开始时间排序
            items.sort(Comparator.comparing(WeekScheduleVO.CalendarItem::getStartTime));

            daySchedule.setItems(items);
            days.add(daySchedule);
        }

        vo.setDays(days);
        int totalItems = days.stream().mapToInt(d -> d.getItems().size()).sum();
        log.info("WeekView returning: weekStart={}, weekEnd={}, totalDays={}, totalItems={}",
                vo.getWeekStart(), vo.getWeekEnd(), days.size(), totalItems);
        return ApiResponse.ok(vo);
    }

    private boolean isSameDay(LocalDateTime dateTime, LocalDate date) {
        return dateTime.toLocalDate().equals(date);
    }
}
