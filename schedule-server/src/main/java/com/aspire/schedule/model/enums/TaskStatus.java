package com.aspire.schedule.model.enums;

import lombok.Getter;

@Getter
public enum TaskStatus {
    TODO,
    IN_PROGRESS,
    DONE,
    DELAYED,
    CANCELLED
}
