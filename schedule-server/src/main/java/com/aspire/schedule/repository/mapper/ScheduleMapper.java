package com.aspire.schedule.repository.mapper;

import com.aspire.schedule.repository.entity.Schedule;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface ScheduleMapper extends BaseMapper<Schedule> {
}
