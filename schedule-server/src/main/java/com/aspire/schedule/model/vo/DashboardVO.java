package com.aspire.schedule.model.vo;

import com.aspire.schedule.repository.entity.Schedule;
import com.aspire.schedule.repository.entity.Task;
import lombok.Data;

import java.util.List;

@Data
public class DashboardVO {

    private List<Task> todayTasks;
    private List<Task> upcomingTasks;
    private List<Schedule> todaySchedules;
    private int totalTasks;
    private int completedTasks;
    private int delayedTasks;
    private List<Task> highPriorityTasks;
}
