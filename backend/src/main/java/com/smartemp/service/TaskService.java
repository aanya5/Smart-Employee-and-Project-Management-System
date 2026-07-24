package com.smartemp.service;

import com.smartemp.model.enums.ProjectStatus;
import com.smartemp.dto.request.TaskRequest;
import com.smartemp.dto.request.TaskUpdateRequest;
import com.smartemp.dto.response.TaskResponse;
import com.smartemp.exception.ResourceNotFoundException;
import com.smartemp.mapper.EntityMapper;
import com.smartemp.model.entity.AuditLog;
import com.smartemp.model.entity.Project;
import com.smartemp.model.entity.Task;
import com.smartemp.model.entity.User;
import com.smartemp.model.enums.Priority;
import com.smartemp.model.enums.TaskStatus;
import com.smartemp.repository.AuditLogRepository;
import com.smartemp.repository.ProjectRepository;
import com.smartemp.repository.TaskRepository;
import com.smartemp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TaskService {

    private static final Logger log = LoggerFactory.getLogger(TaskService.class);

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final EntityMapper mapper;
    private final AuditLogRepository auditLogRepository;

    public Page<TaskResponse> search(String search, TaskStatus status, Priority priority, String department,
            Long projectId, Long assigneeId,
            LocalDate dueBefore, LocalDate dueAfter, Pageable pageable) {
        return taskRepository
                .searchTasks(search, status, priority, department, projectId, assigneeId, dueBefore, dueAfter, pageable)
                .map(mapper::toTaskResponse);
    }

    public TaskResponse getById(Long id) {
        return mapper.toTaskResponse(findTask(id));
    }

    public List<TaskResponse> getByAssignee(Long assigneeId) {
        return taskRepository.findByAssigneeId(assigneeId).stream()
                .map(mapper::toTaskResponse)
                .collect(Collectors.toList());
    }

    public List<TaskResponse> getByProject(Long projectId) {
        return taskRepository.findByProjectId(projectId).stream()
                .map(mapper::toTaskResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public TaskResponse create(TaskRequest request) {
        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        Task task = Task.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .status(request.getStatus())
                .priority(request.getPriority())
                .progress(request.getProgress() != null ? request.getProgress() : 0)
                .remarks(request.getRemarks())
                .dueDate(request.getDueDate())
                .project(project)
                .build();

        if (request.getAssigneeId() != null) {
            task.setAssignee(findUser(request.getAssigneeId()));
        }

        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        userRepository.findByEmail(email).ifPresent(task::setCreatedBy);

        task = taskRepository.save(task);
        updateProjectStatus(project);
        log.info("Task created: {}", task.getTitle());

        auditLogRepository.save(AuditLog.builder()
                .action("CREATE")
                .entityType("Task")
                .entityId(task.getId())
                .performedBy(email)
                .details("Task created: " + task.getTitle())
                .build());

        return mapper.toTaskResponse(task);
    }

    @Transactional
    public TaskResponse update(Long id, TaskRequest request) {
        Task task = findTask(id);
        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        task.setTitle(request.getTitle());
        task.setDescription(request.getDescription());
        task.setStatus(request.getStatus());
        task.setPriority(request.getPriority());
        task.setProgress(request.getProgress() != null ? request.getProgress() : task.getProgress());
        task.setRemarks(request.getRemarks());
        task.setDueDate(request.getDueDate());
        task.setProject(project);

        if (request.getAssigneeId() != null) {
            task.setAssignee(findUser(request.getAssigneeId()));
        } else {
            task.setAssignee(null);
        }

        task = taskRepository.save(task);
        updateProjectStatus(project);
        log.info("Task updated: {}", task.getTitle());
        return mapper.toTaskResponse(task);
    }

    @Transactional
    public TaskResponse updateProgress(Long id, TaskUpdateRequest request) {
        Task task = findTask(id);
        if (request.getStatus() != null)
            task.setStatus(request.getStatus());
        if (request.getProgress() != null) {
            task.setProgress(request.getProgress());
            if (request.getProgress() == 100) {
                task.setStatus(TaskStatus.COMPLETED);
            }
        }
        if (request.getRemarks() != null)
            task.setRemarks(request.getRemarks());

        task = taskRepository.save(task);
        updateProjectStatus(task.getProject());
        log.info("Task progress updated: {} -> {}%", task.getTitle(), task.getProgress());
        return mapper.toTaskResponse(task);
    }

    @Transactional
    public void delete(Long id) {
        Task task = findTask(id);
        Project project = task.getProject();
        taskRepository.delete(task);
        updateProjectStatus(project);
        log.info("Task deleted: {}", task.getTitle());

        auditLogRepository.save(AuditLog.builder()
                .action("DELETE")
                .entityType("Task")
                .entityId(id)
                .performedBy(SecurityContextHolder.getContext().getAuthentication().getName())
                .details("Task deleted: " + task.getTitle())
                .build());
    }

    private void updateProjectStatus(Project project) {
        if (project.getStatus() == ProjectStatus.ON_HOLD ||
                project.getStatus() == ProjectStatus.CANCELLED) {
            return;
        }

        List<Task> tasks = taskRepository.findByProjectId(project.getId());

        if (tasks.isEmpty()) {
            project.setStatus(ProjectStatus.PLANNING);
        } else if (tasks.stream().allMatch(t -> t.getStatus() == TaskStatus.TODO)) {
            project.setStatus(ProjectStatus.PLANNING);
        } else if (tasks.stream().allMatch(t -> t.getStatus() == TaskStatus.COMPLETED)) {
            project.setStatus(ProjectStatus.COMPLETED);
        } else {
            project.setStatus(ProjectStatus.IN_PROGRESS);
        }

        projectRepository.save(project);
    }

    private Task findTask(Long id) {
        return taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));
    }

    private User findUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
    }
}
