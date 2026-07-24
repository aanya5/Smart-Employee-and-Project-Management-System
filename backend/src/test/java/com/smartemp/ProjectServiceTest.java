package com.smartemp;

import com.smartemp.dto.response.ProjectResponse;
import com.smartemp.exception.ResourceNotFoundException;
import com.smartemp.mapper.EntityMapper;
import com.smartemp.model.entity.Project;
import com.smartemp.repository.AuditLogRepository;
import com.smartemp.repository.ProjectRepository;
import com.smartemp.repository.UserRepository;
import com.smartemp.service.ProjectService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProjectServiceTest {

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private EntityMapper mapper;

    @Mock
    private AuditLogRepository auditLogRepository;

    @InjectMocks
    private ProjectService projectService;

    @Test
    void projectServiceShouldBeCreated() {
        assertNotNull(projectService);
    }

    @Test
    void shouldThrowExceptionWhenProjectNotFound() {

        when(projectRepository.findById(1L))
                .thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> projectService.getById(1L));
    }

    @Test
    void shouldReturnProjectById() {

        Project project = Project.builder()
                .id(1L)
                .name("Employee Portal")
                .build();

        ProjectResponse response = ProjectResponse.builder()
                .id(1L)
                .name("Employee Portal")
                .build();

        when(projectRepository.findById(1L))
                .thenReturn(Optional.of(project));

        when(mapper.toProjectResponse(project))
                .thenReturn(response);

        ProjectResponse result = projectService.getById(1L);

        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals("Employee Portal", result.getName());
    }

    @Test
    void shouldThrowExceptionWhenDeletingProjectNotFound() {

        when(projectRepository.findById(1L))
                .thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> projectService.delete(1L));
    }

    @Test
    void shouldThrowExceptionWhenAssigningEmployeesToProjectNotFound() {

        when(projectRepository.findById(1L))
                .thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> projectService.assignEmployees(1L, Set.of(2L, 3L)));
    }

    @Test
    void shouldReturnProjectsByEmployee() {

        Project project = Project.builder()
                .id(1L)
                .name("Employee Portal")
                .build();

        ProjectResponse response = ProjectResponse.builder()
                .id(1L)
                .name("Employee Portal")
                .build();

        when(projectRepository.findByEmployeeId(2L))
                .thenReturn(java.util.List.of(project));

        when(mapper.toProjectResponse(project))
                .thenReturn(response);

        var result = projectService.getByEmployee(2L);

        assertEquals(1, result.size());
        assertEquals("Employee Portal", result.get(0).getName());
    }

}