package com.aspire.schedule.model.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;

@Data
public class PlanConfirmDTO {

    private List<PlanItemInput> items;

    @Data
    public static class PlanItemInput {
        @NotBlank(message = "标题不能为空")
        private String title;

        @NotBlank(message = "开始时间不能为空")
        private String startTime;

        @NotBlank(message = "结束时间不能为空")
        private String endTime;

        private String priority;
    }
}
