package com.smartemp.service;

import com.smartemp.dto.request.ProjectRequest;
import com.smartemp.dto.response.ProjectResponse;
import com.smartemp.exception.ResourceNotFoundException;
import com.smartemp.mapper.EntityMapper;
import com.smartemp.model.entity.AuditLog;
import com.smartemp.model.entity.Project;
import com.smartemp.model.entity.User;
import com.smartemp.model.enums.Priority;
import com.smartemp.model.enums.ProjectStatus;
import com.smartemp.repository.AuditLogRepository;
import com.smartemp.repository.ProjectRepository;
import com.smartemp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private static final Logger log = LoggerFactory.getLogger(ProjectService.class);

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final EntityMapper mapper;
    private final AuditLogRepository auditLogRepository;

    public Page<ProjectResponse> search(String search, ProjectStatus status, Priority priority, LocalDate deadlineFrom,
            LocalDate deadlineTo, Pageable pageable) {
        return projectRepository.searchProjects(search, status, priority, deadlineFrom,
                deadlineTo,
                pageable)
                .map(mapper::toProjectResponse);
    }

    public ProjectResponse getById(Long id) {
        return mapper.toProjectResponse(findProject(id));
    }

    public List<ProjectResponse> getByEmployee(Long employeeId) {
        return projectRepository.findByEmployeeId(employeeId).stream()
                .map(mapper::toProjectResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public ProjectResponse create(ProjectRequest request) {
        Project project = Project.builder()
                .name(request.getName())
                .description(request.getDescription())
                .status(request.getStatus())
                .priority(request.getPriority())
                .startDate(request.getStartDate())
                .deadline(request.getDeadline())
                .build();

        if (request.getManagerId() != null) {
            project.setManager(findUser(request.getManagerId()));
        }
        if (request.getEmployeeIds() != null && !request.getEmployeeIds().isEmpty()) {
            project.setEmployees(resolveEmployees(request.getEmployeeIds()));
        }

        project = projectRepository.save(project);
        log.info("Project created: {}", project.getName());

        auditLogRepository.save(AuditLog.builder()
                .action("CREATE")
                .entityType("Project")
                .entityId(project.getId())
                .performedBy("ADMIN")
                .details("Project created: " + project.getName())
                .build());

        return mapper.toProjectResponse(project);
    }

    @Transactional
    public ProjectResponse update(Long id, ProjectRequest request) {
        Project project = findProject(id);
        project.setName(request.getName());
        project.setDescription(request.getDescription());
        project.setStatus(request.getStatus());
        project.setPriority(request.getPriority());
        project.setStartDate(request.getStartDate());
        project.setDeadline(request.getDeadline());

        if (request.getManagerId() != null) {
            project.setManager(findUser(request.getManagerId()));
        } else {
            project.setManager(null);
        }

        if (request.getEmployeeIds() != null) {
            project.setEmployees(resolveEmployees(request.getEmployeeIds()));
        }

        project = projectRepository.save(project);
        log.info("Project updated: {}", project.getName());

        auditLogRepository.save(AuditLog.builder()
                .action("UPDATE")
                .entityType("Project")
                .entityId(project.getId())
                .performedBy("ADMIN")
                .details("Project updated: " + project.getName())
                .build());

        return mapper.toProjectResponse(project);
    }

    @Transactional
    public ProjectResponse assignEmployees(Long projectId, Set<Long> employeeIds) {
        Project project = findProject(projectId);
        project.setEmployees(resolveEmployees(employeeIds));
        project = projectRepository.save(project);
        return mapper.toProjectResponse(project);
    }

    @Transactional
    public void delete(Long id) {
        Project project = findProject(id);
        projectRepository.delete(project);
        log.info("Project deleted: {}", project.getName());

        auditLogRepository.save(AuditLog.builder()
                .action("DELETE")
                .entityType("Project")
                .entityId(id)
                .performedBy("ADMIN")
                .details("Project deleted: " + project.getName())
                .build());
    }

    private Project findProject(Long id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + id));
    }

    private User findUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
    }

    private Set<User> resolveEmployees(Set<Long> ids) {
        Set<User> employees = new HashSet<>();
        for (Long id : ids) {
            employees.add(findUser(id));
        }
        return employees;
    }
}
