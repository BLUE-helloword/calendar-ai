package com.aspire.schedule.repository.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("task")
public class Task {

    @TableId(type = IdType.AUTO)
    private Long id;
    private Long goalId;
    private Long userId;
    private String title;
    private String description;
    private Integer priority;
    private String status;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private BigDecimal estimatedHours;
    private Long parentTaskId;
    private String dependencyType;
    private String sourceType;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
