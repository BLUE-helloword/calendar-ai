package com.aspire.schedule.service;

import com.aspire.schedule.repository.entity.Reminder;
import com.aspire.schedule.repository.mapper.ReminderMapper;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReminderService {

    private final ReminderMapper reminderMapper;

    public Reminder create(Reminder reminder) {
        reminderMapper.insert(reminder);
        return reminder;
    }

    public void batchCreate(List<Reminder> reminders) {
        reminders.forEach(reminderMapper::insert);
    }

    public Reminder update(Reminder reminder) {
        reminderMapper.updateById(reminder);
        return reminder;
    }

    public void delete(Long id) {
        reminderMapper.deleteById(id);
    }

    public List<Reminder> findByUserId(Long userId) {
        return reminderMapper.selectList(
                new LambdaQueryWrapper<Reminder>()
                        .eq(Reminder::getUserId, userId));
    }

    public List<Reminder> findPendingReminders() {
        return reminderMapper.selectList(
                new LambdaQueryWrapper<Reminder>()
                        .eq(Reminder::getStatus, "PENDING")
                        .le(Reminder::getRemindTime, LocalDateTime.now()));
    }
}
