package com.aspire.schedule.service;

import com.aspire.schedule.model.enums.TaskStatus;
import com.aspire.schedule.repository.entity.Task;
import com.aspire.schedule.repository.mapper.TaskMapper;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskMapper taskMapper;

    public Task create(Task task) {
        taskMapper.insert(task);
        return task;
    }

    public Task update(Task task) {
        taskMapper.updateById(task);
        return task;
    }

    public void updateStatus(Long id, String status) {
        Task task = new Task();
        task.setId(id);
        task.setStatus(status);
        taskMapper.updateById(task);
    }

    public void delete(Long id) {
        taskMapper.deleteById(id);
    }

    public Task findById(Long id) {
        return taskMapper.selectById(id);
    }

    public List<Task> findByGoalId(Long goalId) {
        return taskMapper.selectList(
                new LambdaQueryWrapper<Task>().eq(Task::getGoalId, goalId));
    }

    public List<Task> findByUserId(Long userId, String status, String priority) {
        LambdaQueryWrapper<Task> wrapper = new LambdaQueryWrapper<Task>()
                .eq(Task::getUserId, userId);
        if (status != null && !status.isEmpty()) {
            wrapper.eq(Task::getStatus, status);
        }
        if (priority != null && !priority.isEmpty()) {
            wrapper.eq(Task::getPriority, Integer.parseInt(priority));
        }
        wrapper.orderByDesc(Task::getCreatedAt);
        return taskMapper.selectList(wrapper);
    }

    public Page<Task> pageQuery(Long userId, int page, int size) {
        LambdaQueryWrapper<Task> wrapper = new LambdaQueryWrapper<Task>()
                .eq(Task::getUserId, userId)
                .orderByAsc(Task::getStartTime);
        return taskMapper.selectPage(new Page<>(page, size), wrapper);
    }

    public List<Task> findCompletedInRange(Long userId, java.time.LocalDateTime start, java.time.LocalDateTime end) {
        return taskMapper.selectList(
                new LambdaQueryWrapper<Task>()
                        .eq(Task::getUserId, userId)
                        .eq(Task::getStatus, TaskStatus.DONE.name())
                        .between(Task::getEndTime, start, end));
    }

    public List<Task> findByUserAndTimeRange(Long userId, java.time.LocalDateTime start, java.time.LocalDateTime end) {
        return taskMapper.selectList(
                new LambdaQueryWrapper<Task>()
                        .eq(Task::getUserId, userId)
                        .isNotNull(Task::getStartTime)
                        .isNotNull(Task::getEndTime)
                        .ge(Task::getStartTime, start)
                        .le(Task::getStartTime, end));
    }
}
