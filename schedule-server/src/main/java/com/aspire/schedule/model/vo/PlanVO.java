package com.aspire.schedule.model.vo;

import lombok.Data;

import java.util.List;

@Data
public class PlanVO {

    private Long goalId;
    private String parsedTarget;
    private List<PlanItem> planItems;

    @Data
    public static class PlanItem {
        private String title;
        private String startTime;
        private String endTime;
        private double estimatedHours;
        private String priority;
        private boolean hasConflict;
        private String conflictDetail;
    }
}
