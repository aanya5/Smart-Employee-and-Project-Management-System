package com.smartemp.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
@Builder
public class DashboardResponse {
    private long totalEmployees;
    private long activeEmployees;
    private long totalProjects;
    private long totalTasks;
    private long completedTasks;
    private long pendingTasks;
    private long inProgressTasks;
    private Map<String, Long> projectsByStatus;
    private Map<String, Long> tasksByPriority;
    private List<TaskResponse> upcomingDeadlines;
    private List<TaskResponse> recentTasks;
    private List<ProjectResponse> recentProjects;
}
