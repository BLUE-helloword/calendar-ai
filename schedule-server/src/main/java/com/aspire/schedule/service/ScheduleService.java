package com.aspire.schedule.service;

import com.aspire.schedule.repository.entity.Schedule;
import com.aspire.schedule.repository.mapper.ScheduleMapper;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ScheduleService {

    private final ScheduleMapper scheduleMapper;

    public Schedule create(Schedule schedule) {
        scheduleMapper.insert(schedule);
        return schedule;
    }

    public void batchCreate(List<Schedule> schedules) {
        schedules.forEach(scheduleMapper::insert);
    }

    public List<Schedule> findByUserAndRange(Long userId, LocalDateTime start, LocalDateTime end) {
        return scheduleMapper.selectList(
                new LambdaQueryWrapper<Schedule>()
                        .eq(Schedule::getUserId, userId)
                        .eq(Schedule::getStatus, "ACTIVE")
                        .ge(Schedule::getStartTime, start)
                        .le(Schedule::getEndTime, end));
    }

    public List<Schedule> findByUserId(Long userId) {
        return scheduleMapper.selectList(
                new LambdaQueryWrapper<Schedule>()
                        .eq(Schedule::getUserId, userId)
                        .eq(Schedule::getStatus, "ACTIVE")
                        .orderByAsc(Schedule::getStartTime));
    }
}
