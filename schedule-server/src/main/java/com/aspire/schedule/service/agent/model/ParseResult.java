package com.aspire.schedule.service.agent.model;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
public class ParseResult {

    private Long goalId;
    private boolean completed;

    // 解析字段
    private String parsedTarget;
    private String parsedDeadline;
    private String parsedItems;

    // 追问字段
    private List<String> missingInfo = new ArrayList<>();
    private double confidence;
    private boolean needsClarification;

    public static ParseResult needsClarification(Long goalId, ParseResult partial,
                                                  List<String> questions) {
        ParseResult r = new ParseResult();
        r.goalId = goalId;
        r.completed = false;
        r.needsClarification = true;
        r.missingInfo = questions;
        r.confidence = partial != null ? partial.confidence : 0.0;
        if (partial != null) {
            r.parsedTarget = partial.parsedTarget;
            r.parsedDeadline = partial.parsedDeadline;
            r.parsedItems = partial.parsedItems;
        }
        return r;
    }

    public static ParseResult completed(Long goalId, ParseResult result) {
        ParseResult r = new ParseResult();
        r.goalId = goalId;
        r.completed = true;
        r.needsClarification = false;
        r.parsedTarget = result.parsedTarget;
        r.parsedDeadline = result.parsedDeadline;
        r.parsedItems = result.parsedItems;
        r.confidence = result.confidence;
        return r;
    }
}
