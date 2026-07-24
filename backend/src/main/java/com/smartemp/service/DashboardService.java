package com.smartemp.service;

import com.smartemp.dto.response.DashboardResponse;
import com.smartemp.dto.response.ProjectResponse;
import com.smartemp.dto.response.TaskResponse;
import com.smartemp.exception.ResourceNotFoundException;
import com.smartemp.mapper.EntityMapper;
import com.smartemp.model.entity.User;
import com.smartemp.model.enums.Priority;
import com.smartemp.model.enums.ProjectStatus;
import com.smartemp.model.enums.Role;
import com.smartemp.model.enums.TaskStatus;
import com.smartemp.repository.ProjectRepository;
import com.smartemp.repository.TaskRepository;
import com.smartemp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final EntityMapper mapper;

    public DashboardResponse getAdminDashboard() {
        Map<String, Long> projectsByStatus = new LinkedHashMap<>();
        for (ProjectStatus status : ProjectStatus.values()) {
            projectsByStatus.put(status.name(), projectRepository.countByStatus(status));
        }

        Map<String, Long> tasksByPriority = new LinkedHashMap<>();
        for (Priority priority : Priority.values()) {
                long count = taskRepository.findAll().stream()
                                .filter(t -> t.getPriority() == priority)
                                .count();
                tasksByPriority.put(priority.name(), count);
        }

        List<TaskResponse> upcoming = taskRepository.searchTasks(
                        null, // search
                        null, // status
                        null, // priority
                        null, // department
                        null, // projectId
                        null, // assigneeId
                        LocalDate.now().plusDays(14), // dueBefore
                        LocalDate.now(), // dueAfter
                        PageRequest.of(0, 10, Sort.by("dueDate").ascending()))
                        .map(mapper::toTaskResponse)
                        .getContent();

        List<TaskResponse> recentTasks = taskRepository.findAll(
                        PageRequest.of(0, 5, Sort.by("createdAt").descending()))
                        .map(mapper::toTaskResponse)
                        .getContent();

        List<ProjectResponse> recentProjects = projectRepository.findAll(
                        PageRequest.of(0, 5, Sort.by("createdAt").descending()))
                        .map(mapper::toProjectResponse)
                        .getContent();

        return DashboardResponse.builder()
                        .totalEmployees(userRepository.countByRole(Role.EMPLOYEE))
                .activeEmployees(userRepository.countByActiveTrue())
                .totalProjects(projectRepository.count())
                .totalTasks(taskRepository.count())
                .completedTasks(taskRepository.countByStatus(TaskStatus.COMPLETED))
                .pendingTasks(taskRepository.countByStatus(TaskStatus.TODO))
                .inProgressTasks(taskRepository.countByStatus(TaskStatus.IN_PROGRESS))
                .projectsByStatus(projectsByStatus)
                .tasksByPriority(tasksByPriority)
                .upcomingDeadlines(upcoming)
                .recentTasks(recentTasks)
                .recentProjects(recentProjects)
                .build();
    }

    public DashboardResponse getEmployeeDashboard(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        List<TaskResponse> myTasks = taskRepository.findByAssigneeId(user.getId()).stream()
                .map(mapper::toTaskResponse)
                .collect(Collectors.toList());

        List<TaskResponse> completed = myTasks.stream()
                .filter(t -> t.getStatus() == TaskStatus.COMPLETED)
                .collect(Collectors.toList());

        List<TaskResponse> upcoming = myTasks.stream()
                .filter(t -> t.getDueDate() != null
                        && !t.getDueDate().isBefore(LocalDate.now())
                        && t.getStatus() != TaskStatus.COMPLETED)
                .sorted((a, b) -> a.getDueDate().compareTo(b.getDueDate()))
                .limit(10)
                .collect(Collectors.toList());

        Map<String, Long> tasksByPriority = Arrays.stream(Priority.values())
                .collect(Collectors.toMap(
                        Enum::name,
                        p -> myTasks.stream().filter(t -> t.getPriority() == p).count(),
                        (a, b) -> a,
                        LinkedHashMap::new
                ));

        return DashboardResponse.builder()
                .totalTasks(myTasks.size())
                .completedTasks(completed.size())
                .pendingTasks(myTasks.stream().filter(t -> t.getStatus() == TaskStatus.TODO).count())
                .inProgressTasks(myTasks.stream().filter(t -> t.getStatus() == TaskStatus.IN_PROGRESS).count())
                .tasksByPriority(tasksByPriority)
                .upcomingDeadlines(upcoming)
                .recentTasks(myTasks.stream().limit(10).collect(Collectors.toList()))
                .build();
    }
}
