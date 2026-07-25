package com.aspire.schedule.model.dto;

import lombok.Data;

@Data
public class TaskUpdateDTO {

    private String title;
    private String description;
    private Integer priority;
    private String startTime;
    private String endTime;
}
