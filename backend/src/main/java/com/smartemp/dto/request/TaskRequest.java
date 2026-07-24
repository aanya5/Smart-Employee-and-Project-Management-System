package com.smartemp.dto.request;

import com.smartemp.model.enums.Priority;
import com.smartemp.model.enums.TaskStatus;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class TaskRequest {
    @NotBlank
    private String title;

    private String description;

    @NotNull
    private TaskStatus status;

    @NotNull
    private Priority priority;

    @Min(0)
    @Max(100)
    private Integer progress = 0;

    private String remarks;
    private LocalDate dueDate;

    @NotNull
    private Long projectId;

    private Long assigneeId;
}
