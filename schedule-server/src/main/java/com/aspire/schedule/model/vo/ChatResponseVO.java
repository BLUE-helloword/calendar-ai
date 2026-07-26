package com.aspire.schedule.model.vo;

import lombok.Data;
import java.util.List;

@Data
public class ChatResponseVO {
    private String sessionId;
    private String type;
    private String text;
    private ScheduleData schedule;
    private List<ConflictData> conflicts;
    private List<String> questions;
    private TaskCreatedData taskCreated;

    @Data
    public static class ScheduleData {
        private String title;
        private String deadline;
        private List<ScheduleItem> items;
    }

    @Data
    public static class ScheduleItem {
        private String title;
        private String startTime;
        private String endTime;
        private double estimatedHours;
        private String priority;
        private boolean hasConflict;
        private String conflictDetail;
    }

    @Data
    public static class ConflictData {
        private String item;
        private String overlapWith;
        private String suggestion;
    }

    @Data
    public static class TaskCreatedData {
        private int createdTasks;
        private int createdSchedules;
        private int createdReminders;
    }
}
