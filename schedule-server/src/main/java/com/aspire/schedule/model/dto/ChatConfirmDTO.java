package com.aspire.schedule.model.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;
import java.util.List;

@Data
public class ChatConfirmDTO {
    @NotBlank(message = "会话ID不能为空")
    private String sessionId;

    @NotEmpty(message = "排期项不能为空")
    private List<PlanConfirmDTO.PlanItemInput> items;
}
