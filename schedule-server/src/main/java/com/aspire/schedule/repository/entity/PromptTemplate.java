package com.aspire.schedule.repository.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("prompt_template")
public class PromptTemplate {

    @TableId(type = IdType.AUTO)
    private Long id;
    private String templateName;
    private String templateType;
    private String agentType;
    private Integer version;
    private String content;
    private String variables;
    private Integer status;
    private BigDecimal effectScore;
    private Integer usageCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
