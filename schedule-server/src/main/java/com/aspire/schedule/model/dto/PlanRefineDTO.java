package com.aspire.schedule.model.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PlanRefineDTO {

    @NotBlank(message = "反馈内容不能为空")
    private String feedback;
}
