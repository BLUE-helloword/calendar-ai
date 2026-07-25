package com.aspire.schedule.repository.mapper;

import com.aspire.schedule.repository.entity.Reminder;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface ReminderMapper extends BaseMapper<Reminder> {
}
