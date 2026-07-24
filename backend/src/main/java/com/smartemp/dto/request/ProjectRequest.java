package com.smartemp.dto.request;

import com.smartemp.model.enums.Priority;
import com.smartemp.model.enums.ProjectStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.util.Set;

@Data
public class ProjectRequest {
    @NotBlank
    private String name;

    private String description;

    @NotNull
    private ProjectStatus status;

    @NotNull
    private Priority priority;

    private LocalDate startDate;
    private LocalDate deadline;
    private Long managerId;
    private Set<Long> employeeIds;
}
