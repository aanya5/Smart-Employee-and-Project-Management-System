package com.smartemp.mapper;

import com.smartemp.dto.response.ProjectResponse;
import com.smartemp.dto.response.TaskResponse;
import com.smartemp.dto.response.UserResponse;
import com.smartemp.model.entity.Project;
import com.smartemp.model.entity.Task;
import com.smartemp.model.entity.User;
import com.smartemp.model.enums.TaskStatus;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

@Component
public class EntityMapper {

    public UserResponse toUserResponse(User user) {
        if (user == null) return null;
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .fullName(user.getFullName())
                .role(user.getRole())
                .department(user.getDepartment())
                .designation(user.getDesignation())
                .phone(user.getPhone())
                .profileImage(user.getProfileImage())
                .active(user.isActive())
                .createdAt(user.getCreatedAt())
                .build();
    }

    public ProjectResponse toProjectResponse(Project project) {
        if (project == null) return null;
        int taskCount = project.getTasks() != null ? project.getTasks().size() : 0;
        int completed = project.getTasks() != null
                ? (int) project.getTasks().stream().filter(t -> t.getStatus() == TaskStatus.COMPLETED).count()
                : 0;
        return ProjectResponse.builder()
                .id(project.getId())
                .name(project.getName())
                .description(project.getDescription())
                .status(project.getStatus())
                .priority(project.getPriority())
                .startDate(project.getStartDate())
                .deadline(project.getDeadline())
                .manager(toUserResponse(project.getManager()))
                .employees(project.getEmployees() != null
                        ? project.getEmployees().stream().map(this::toUserResponse).collect(Collectors.toList())
                        : null)
                .taskCount(taskCount)
                .completedTaskCount(completed)
                .createdAt(project.getCreatedAt())
                .build();
    }

    public TaskResponse toTaskResponse(Task task) {
        if (task == null) return null;
        return TaskResponse.builder()
                .id(task.getId())
                .title(task.getTitle())
                .description(task.getDescription())
                .status(task.getStatus())
                .priority(task.getPriority())
                .progress(task.getProgress())
                .remarks(task.getRemarks())
                .dueDate(task.getDueDate())
                .projectId(task.getProject() != null ? task.getProject().getId() : null)
                .projectName(task.getProject() != null ? task.getProject().getName() : null)
                .assignee(toUserResponse(task.getAssignee()))
                .createdBy(toUserResponse(task.getCreatedBy()))
                .createdAt(task.getCreatedAt())
                .updatedAt(task.getUpdatedAt())
                .build();
    }
}
