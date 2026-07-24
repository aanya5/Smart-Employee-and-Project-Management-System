package com.smartemp.dto.request;

import com.smartemp.model.enums.TaskStatus;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Data;

@Data
public class TaskUpdateRequest {
    private TaskStatus status;

    @Min(0)
    @Max(100)
    private Integer progress;

    private String remarks;
}
