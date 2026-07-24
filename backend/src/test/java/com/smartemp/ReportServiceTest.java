package com.smartemp;

import com.smartemp.exception.ResourceNotFoundException;
import com.smartemp.mapper.EntityMapper;
import com.smartemp.repository.ProjectRepository;
import com.smartemp.repository.TaskRepository;
import com.smartemp.repository.UserRepository;
import com.smartemp.service.ReportService;
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
class ReportServiceTest {

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private EntityMapper mapper;

    @InjectMocks
    private ReportService reportService;

    @Test
    void reportServiceShouldBeCreated() {
        assertNotNull(reportService);
    }

    @Test
    void shouldThrowExceptionWhenEmployeeNotFoundForEmployeeReport() {

        when(userRepository.findById(1L))
                .thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> reportService.employeeTaskReport(1L));
    }

    @Test
    void shouldThrowExceptionWhenEmployeeNotFoundForEmployeeExcelExport() {

        when(userRepository.findById(1L))
                .thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> reportService.exportEmployeeTasksExcel(1L));
    }

    @Test
    void shouldThrowExceptionWhenProjectNotFoundForProjectExcelExport() {

        when(projectRepository.findById(1L))
                .thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> reportService.exportProjectTasksExcel(1L));
    }

    @Test
    void shouldThrowExceptionWhenProjectNotFoundForProjectPdfExport() {

        when(projectRepository.findById(1L))
                .thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> reportService.exportProjectTasksPdf(1L));
    }
}