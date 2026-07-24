package com.smartemp;

import com.smartemp.dto.request.EmployeeRequest;
import com.smartemp.dto.response.UserResponse;
import com.smartemp.exception.BadRequestException;
import com.smartemp.exception.ResourceNotFoundException;
import com.smartemp.mapper.EntityMapper;
import com.smartemp.model.entity.User;
import com.smartemp.repository.AuditLogRepository;
import com.smartemp.repository.UserRepository;
import com.smartemp.service.EmployeeService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EmployeeServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private EntityMapper mapper;

    @Mock
    private AuditLogRepository auditLogRepository;

    @InjectMocks
    private EmployeeService employeeService;

    @Test
    void employeeServiceShouldBeCreated() {
        assertNotNull(employeeService);
    }

    @Test
    void shouldThrowExceptionWhenEmployeeNotFound() {

        when(userRepository.findById(1L))
                .thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> employeeService.getById(1L));
    }

    @Test
    void shouldReturnEmployeeById() {

        User user = User.builder()
                .id(1L)
                .email("john@test.com")
                .firstName("John")
                .build();

        UserResponse response = UserResponse.builder()
                .id(1L)
                .email("john@test.com")
                .firstName("John")
                .build();

        when(userRepository.findById(1L))
                .thenReturn(Optional.of(user));

        when(mapper.toUserResponse(user))
                .thenReturn(response);

        UserResponse result = employeeService.getById(1L);

        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals("John", result.getFirstName());
    }

    @Test
    void shouldThrowExceptionWhenDeletingEmployeeNotFound() {

        when(userRepository.findById(1L))
                .thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> employeeService.delete(1L));
    }

    @Test
    void shouldThrowExceptionWhenEmailAlreadyExists() {

        EmployeeRequest request = new EmployeeRequest();
        request.setEmail("john@test.com");
        request.setPassword("password123");

        when(userRepository.existsByEmail("john@test.com"))
                .thenReturn(true);

        assertThrows(BadRequestException.class,
                () -> employeeService.create(request));
    }

    @Test
    void shouldThrowExceptionWhenPasswordIsMissing() {

        EmployeeRequest request = new EmployeeRequest();
        request.setEmail("john@test.com");
        request.setPassword("");

        when(userRepository.existsByEmail("john@test.com"))
                .thenReturn(false);

        assertThrows(BadRequestException.class,
                () -> employeeService.create(request));
    }
}
