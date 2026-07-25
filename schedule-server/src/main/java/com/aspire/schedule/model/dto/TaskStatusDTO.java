package com.aspire.schedule.model.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class TaskStatusDTO {

    @NotBlank(message = "状态不能为空")
    private String status;
}
