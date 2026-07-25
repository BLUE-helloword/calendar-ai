package com.aspire.schedule.repository.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("reminder")
public class Reminder {

    @TableId(type = IdType.AUTO)
    private Long id;
    private Long userId;
    private Long taskId;
    private LocalDateTime remindTime;
    private String remindType;
    private String channel;
    private String message;
    private String status;
    private LocalDateTime createdAt;
}
