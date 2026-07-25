package com.aspire.schedule.model.vo;

import lombok.Data;

import java.util.List;

@Data
public class GoalParseVO {

    private Long goalId;
    private String status;          // PARSING / CLARIFYING / PARSED
    private String parsedTarget;
    private String parsedDeadline;
    private String parsedItems;
    private double confidence;
    private boolean needsClarification;
    private List<String> questions; // 追问问题列表
    private int currentRound;
}
