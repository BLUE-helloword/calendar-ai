package com.aspire.schedule.model.vo;

import lombok.Data;

import java.util.List;

@Data
public class WeekScheduleVO {

    private String weekStart;
    private String weekEnd;
    private List<DaySchedule> days;

    @Data
    public static class DaySchedule {
        private String date;
        private String dayOfWeek;
        private List<CalendarItem> items;
    }

    @Data
    public static class CalendarItem {
        private Long id;
        private String type;      // SCHEDULE / TASK
        private String title;
        private String startTime;
        private String endTime;
        private String color;
        private String status;
        private Integer priority;
    }
}
