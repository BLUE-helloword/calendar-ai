package com.aspire.schedule.model.vo;

import com.aspire.schedule.repository.entity.Task;
import lombok.Data;

import java.util.List;

@Data
public class ReportVO {

    private List<Task> completedTasks;
    private int completedCount;
    private int totalCount;
    private String period;
}
