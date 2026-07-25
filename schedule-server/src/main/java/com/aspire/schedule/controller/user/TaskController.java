package com.aspire.schedule.controller.user;

import com.aspire.schedule.common.response.ApiResponse;
import com.aspire.schedule.model.dto.TaskStatusDTO;
import com.aspire.schedule.model.dto.TaskUpdateDTO;
import com.aspire.schedule.repository.entity.Task;
import com.aspire.schedule.security.JwtTokenProvider;
import com.aspire.schedule.service.GoalService;
import com.aspire.schedule.service.TaskService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Tag(name = "任务管理")
@RestController
@RequestMapping("/api/v1/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;
    private final GoalService goalService;
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

    @Operation(summary = "获取任务列表")
    @GetMapping
    public ApiResponse<List<Task>> list(@RequestParam(required = false) String status,
                                         @RequestParam(required = false) String priority,
                                         HttpServletRequest request) {
        Long userId = getUserId(request);
        List<Task> tasks = taskService.findByUserId(userId, status, priority);
        return ApiResponse.ok(tasks);
    }

    @Operation(summary = "获取任务详情")
    @GetMapping("/{id}")
    public ApiResponse<Task> detail(@PathVariable Long id) {
        Task task = taskService.findById(id);
        if (task == null) {
            return ApiResponse.fail(404, "任务不存在");
        }
        return ApiResponse.ok(task);
    }

    @Operation(summary = "更新任务")
    @PutMapping("/{id}")
    public ApiResponse<Task> update(@PathVariable Long id,
                                     @RequestBody TaskUpdateDTO dto) {
        Task task = new Task();
        task.setId(id);
        if (StringUtils.hasText(dto.getTitle())) {
            task.setTitle(dto.getTitle());
        }
        if (dto.getDescription() != null) {
            task.setDescription(dto.getDescription());
        }
        if (dto.getPriority() != null) {
            task.setPriority(dto.getPriority());
        }
        if (StringUtils.hasText(dto.getStartTime())) {
            task.setStartTime(LocalDateTime.parse(dto.getStartTime(), FORMATTER));
        }
        if (StringUtils.hasText(dto.getEndTime())) {
            task.setEndTime(LocalDateTime.parse(dto.getEndTime(), FORMATTER));
        }
        taskService.update(task);
        Task updated = taskService.findById(id);
        return ApiResponse.ok(updated);
    }

    @Operation(summary = "更新任务状态")
    @PutMapping("/{id}/status")
    public ApiResponse<Void> updateStatus(@PathVariable Long id,
                                           @RequestBody @Valid TaskStatusDTO dto) {
        taskService.updateStatus(id, dto.getStatus());
        return ApiResponse.ok();
    }

    @Operation(summary = "删除任务")
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        taskService.delete(id);
        return ApiResponse.ok();
    }
}
