package com.aspire.schedule.service.agent.model;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class SubTask {

    private String name;
    private BigDecimal estimatedHours;
    private String priority;  // HIGH/MEDIUM/LOW
    private String dependsOn; // 前置任务名
}
