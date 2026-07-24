package com.smartemp;

import com.smartemp.dto.request.TaskRequest;
import com.smartemp.dto.response.TaskResponse;
import com.smartemp.exception.ResourceNotFoundException;
import com.smartemp.mapper.EntityMapper;
import com.smartemp.model.entity.Task;
import com.smartemp.model.enums.Priority;
import com.smartemp.model.enums.TaskStatus;
import com.smartemp.repository.AuditLogRepository;
import com.smartemp.repository.ProjectRepository;
import com.smartemp.repository.TaskRepository;
import com.smartemp.repository.UserRepository;
import com.smartemp.service.TaskService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TaskServiceTest {

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private EntityMapper mapper;

    @Mock
    private AuditLogRepository auditLogRepository;

    @InjectMocks
    private TaskService taskService;

    @Test
    void taskServiceShouldBeCreated() {
        org.junit.jupiter.api.Assertions.assertNotNull(taskService);
    }

    @Test
    void shouldThrowExceptionWhenTaskNotFound() {

        when(taskRepository.findById(1L))
                .thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> taskService.getById(1L));
    }

    @Test
    void shouldReturnTaskById() {

        Task task = Task.builder()
                .id(1L)
                .title("Login Page")
                .status(TaskStatus.TODO)
                .priority(Priority.MEDIUM)
                .build();

        TaskResponse response = TaskResponse.builder()
                .id(1L)
                .title("Login Page")
                .status(TaskStatus.TODO)
                .priority(Priority.MEDIUM)
                .build();

        when(taskRepository.findById(1L))
                .thenReturn(Optional.of(task));

        when(mapper.toTaskResponse(task))
                .thenReturn(response);

        TaskResponse result = taskService.getById(1L);

        assertNotNull(result);
        org.junit.jupiter.api.Assertions.assertEquals(1L, result.getId());
        org.junit.jupiter.api.Assertions.assertEquals("Login Page", result.getTitle());
    }

    @Test
    void shouldThrowExceptionWhenProjectNotFound() {

        TaskRequest request = new TaskRequest();
        request.setProjectId(1L);

        when(projectRepository.findById(1L))
                .thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> taskService.create(request));
    }

}