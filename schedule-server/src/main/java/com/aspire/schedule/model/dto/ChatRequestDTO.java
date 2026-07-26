package com.aspire.schedule.model.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ChatRequestDTO {
    private String sessionId;
    @NotBlank(message = "消息内容不能为空")
    private String message;
}
