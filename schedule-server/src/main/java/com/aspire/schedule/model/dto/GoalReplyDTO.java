package com.aspire.schedule.model.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class GoalReplyDTO {

    @NotBlank(message = "回复内容不能为空")
    private String reply;
}
