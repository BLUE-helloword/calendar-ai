package com.aspire.schedule.repository.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("goal")
public class Goal {

    @TableId(type = IdType.AUTO)
    private Long id;
    private Long userId;
    private String rawInput;
    private String parsedTarget;
    private LocalDateTime parsedDeadline;
    private String parsedItems;
    private String status;
    private Integer clarifyRound;
    private Integer scheduleRound;
    private String partialResult;
    private String conversation;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
