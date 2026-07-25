package com.aspire.schedule.model.dto;

import lombok.Data;

@Data
public class ReminderUpdateDTO {

    private String remindTime;
    private String remindType;
    private String channel;
    private String message;
}
