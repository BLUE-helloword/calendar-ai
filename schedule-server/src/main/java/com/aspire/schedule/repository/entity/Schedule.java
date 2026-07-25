package com.aspire.schedule.repository.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("schedule")
public class Schedule {

    @TableId(type = IdType.AUTO)
    private Long id;
    private Long userId;
    private Long taskId;
    private String title;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer isAllDay;
    private String color;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
