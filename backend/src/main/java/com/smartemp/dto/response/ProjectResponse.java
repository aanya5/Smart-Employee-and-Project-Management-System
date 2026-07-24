package com.smartemp.dto.response;

import com.smartemp.model.enums.Priority;
import com.smartemp.model.enums.ProjectStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class ProjectResponse {
    private Long id;
    private String name;
    private String description;
    private ProjectStatus status;
    private Priority priority;
    private LocalDate startDate;
    private LocalDate deadline;
    private UserResponse manager;
    private List<UserResponse> employees;
    private int taskCount;
    private int completedTaskCount;
    private LocalDateTime createdAt;
}
