package com.aspire.schedule.repository.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("agent_log")
public class AgentLog {

    @TableId(type = IdType.AUTO)
    private Long id;
    private String sessionId;
    private Long goalId;
    private Long userId;
    private String phase;
    private String modelName;
    private String promptInput;
    private String modelOutput;
    private String parsedResult;
    private String toolCalls;
    private Integer latencyMs;
    private String tokenUsage;
    private String status;
    private String errorMsg;
    private LocalDateTime createdAt;
}
