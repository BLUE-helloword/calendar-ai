package com.aspire.schedule.service.agent.model;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class Conflict {

    private String taskName;
    private String conflictTaskName;
    private LocalDateTime conflictTime;
    private String suggestion;
}
