package com.aspire.schedule.repository.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("agent_config")
public class AgentConfig {

    @TableId(type = IdType.AUTO)
    private Long id;
    private String agentName;
    private String agentType;
    private String modelProvider;
    private String modelName;
    private String systemPrompt;
    private BigDecimal temperature;
    private Integer maxTokens;
    private String tools;
    private String confirmActions;
    private String fallbackRules;
    private Integer status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
