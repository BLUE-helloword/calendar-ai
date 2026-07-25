package com.aspire.schedule.repository.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("notification_log")
public class NotificationLog {

    @TableId(type = IdType.AUTO)
    private Long id;
    private Long userId;
    private Long reminderId;
    private String channel;
    private String title;
    private String content;
    private String sendStatus;
    private Integer retryCount;
    private String errorMsg;
    private LocalDateTime sentAt;
    private LocalDateTime createdAt;
}
