package com.aspire.schedule.controller.user;

import com.aspire.schedule.common.response.ApiResponse;
import com.aspire.schedule.model.dto.ReminderUpdateDTO;
import com.aspire.schedule.repository.entity.Reminder;
import com.aspire.schedule.security.JwtTokenProvider;
import com.aspire.schedule.service.ReminderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Tag(name = "提醒管理")
@RestController
@RequestMapping("/api/v1/reminders")
@RequiredArgsConstructor
public class ReminderController {

    private final ReminderService reminderService;
    private final JwtTokenProvider jwtTokenProvider;

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private Long getUserId(HttpServletRequest request) {
        String token = request.getHeader("Authorization");
        if (StringUtils.hasText(token) && token.startsWith("Bearer ")) {
            token = token.substring(7);
            return jwtTokenProvider.getUserIdFromToken(token);
        }
        throw new RuntimeException("未认证");
    }

    @Operation(summary = "获取提醒列表")
    @GetMapping
    public ApiResponse<List<Reminder>> list(HttpServletRequest request) {
        Long userId = getUserId(request);
        List<Reminder> reminders = reminderService.findByUserId(userId);
        return ApiResponse.ok(reminders);
    }

    @Operation(summary = "更新提醒")
    @PutMapping("/{id}")
    public ApiResponse<Reminder> update(@PathVariable Long id,
                                         @RequestBody ReminderUpdateDTO dto) {
        Reminder reminder = new Reminder();
        reminder.setId(id);
        if (StringUtils.hasText(dto.getRemindTime())) {
            reminder.setRemindTime(LocalDateTime.parse(dto.getRemindTime(), FORMATTER));
        }
        if (StringUtils.hasText(dto.getRemindType())) {
            reminder.setRemindType(dto.getRemindType());
        }
        if (StringUtils.hasText(dto.getChannel())) {
            reminder.setChannel(dto.getChannel());
        }
        if (dto.getMessage() != null) {
            reminder.setMessage(dto.getMessage());
        }
        reminderService.update(reminder);
        return ApiResponse.ok(reminder);
    }

    @Operation(summary = "删除提醒")
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        reminderService.delete(id);
        return ApiResponse.ok();
    }
}
