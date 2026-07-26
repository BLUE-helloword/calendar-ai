package com.aspire.schedule.service.agent.model;

import lombok.Data;

import java.util.List;

@Data
public class PlanResult {

    private Long goalId;
    private List<PlanItem> plan;
    private List<String> conflicts;
    private List<String> warnings;

    @Data
    public static class PlanItem {
        private String taskTitle;
        private String suggestedStart;
        private String suggestedEnd;
        private double estimatedHours;
        private String priority;
        private boolean hasConflict;
        private String conflictDetail;
    }
}
