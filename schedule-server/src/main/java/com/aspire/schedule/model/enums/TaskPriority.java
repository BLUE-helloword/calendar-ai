package com.aspire.schedule.model.enums;

import lombok.Getter;

@Getter
public enum TaskPriority {
    HIGH(1),
    MEDIUM(2),
    LOW(3);

    private final int value;

    TaskPriority(int value) {
        this.value = value;
    }
}
