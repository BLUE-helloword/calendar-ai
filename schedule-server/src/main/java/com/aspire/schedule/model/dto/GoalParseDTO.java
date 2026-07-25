package com.aspire.schedule.model.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class GoalParseDTO {

    @NotBlank(message = "目标描述不能为空")
    private String rawInput;
}
