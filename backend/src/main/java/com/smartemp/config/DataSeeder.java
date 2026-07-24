package com.smartemp.config;

import com.smartemp.model.entity.Project;
import com.smartemp.model.entity.Task;
import com.smartemp.model.entity.User;
import com.smartemp.model.enums.*;
import com.smartemp.repository.ProjectRepository;
import com.smartemp.repository.TaskRepository;
import com.smartemp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.Set;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) {
            return;
        }

        log.info("Seeding initial data...");

        User admin = userRepository.save(User.builder()
                .email("admin@company.com")
                .password(passwordEncoder.encode("Admin@123"))
                .firstName("System")
                .lastName("Admin")
                .role(Role.ADMIN)
                .department("IT")
                .designation("Administrator")
                .phone("9999999999")
                .active(true)
                .build());

        User john = userRepository.save(User.builder()
                .email("john.doe@company.com")
                .password(passwordEncoder.encode("Emp@123"))
                .firstName("John")
                .lastName("Doe")
                .role(Role.EMPLOYEE)
                .department("Engineering")
                .designation("Software Engineer")
                .phone("9876543210")
                .active(true)
                .build());

        User jane = userRepository.save(User.builder()
                .email("jane.smith@company.com")
                .password(passwordEncoder.encode("Emp@123"))
                .firstName("Jane")
                .lastName("Smith")
                .role(Role.EMPLOYEE)
                .department("Engineering")
                .designation("Senior Developer")
                .phone("9876543211")
                .active(true)
                .build());

        User mike = userRepository.save(User.builder()
                .email("mike.wilson@company.com")
                .password(passwordEncoder.encode("Emp@123"))
                .firstName("Mike")
                .lastName("Wilson")
                .role(Role.EMPLOYEE)
                .department("QA")
                .designation("QA Engineer")
                .phone("9876543212")
                .active(true)
                .build());

        Project portal = projectRepository.save(Project.builder()
                .name("Employee Portal Redesign")
                .description("Redesign the internal employee self-service portal with modern UI.")
                .status(ProjectStatus.IN_PROGRESS)
                .priority(Priority.HIGH)
                .startDate(LocalDate.now().minusDays(30))
                .deadline(LocalDate.now().plusDays(45))
                .manager(admin)
                .employees(Set.of(john, jane))
                .build());

        Project mobile = projectRepository.save(Project.builder()
                .name("Mobile App Launch")
                .description("Build and launch the company mobile application for iOS and Android.")
                .status(ProjectStatus.PLANNING)
                .priority(Priority.CRITICAL)
                .startDate(LocalDate.now())
                .deadline(LocalDate.now().plusDays(90))
                .manager(admin)
                .employees(Set.of(jane, mike))
                .build());

        Project migration = projectRepository.save(Project.builder()
                .name("Database Migration")
                .description("Migrate legacy data to the new MySQL cluster.")
                .status(ProjectStatus.ON_HOLD)
                .priority(Priority.MEDIUM)
                .startDate(LocalDate.now().minusDays(10))
                .deadline(LocalDate.now().plusDays(60))
                .manager(admin)
                .employees(Set.of(john, mike))
                .build());

        taskRepository.save(Task.builder()
                .title("Design wireframes")
                .description("Create wireframes for the new portal dashboard")
                .status(TaskStatus.COMPLETED)
                .priority(Priority.HIGH)
                .progress(100)
                .remarks("Approved by stakeholders")
                .dueDate(LocalDate.now().minusDays(5))
                .project(portal)
                .assignee(jane)
                .createdBy(admin)
                .build());

        taskRepository.save(Task.builder()
                .title("Implement authentication module")
                .description("JWT-based login and registration for the portal")
                .status(TaskStatus.IN_PROGRESS)
                .priority(Priority.CRITICAL)
                .progress(60)
                .remarks("Working on refresh token support")
                .dueDate(LocalDate.now().plusDays(7))
                .project(portal)
                .assignee(john)
                .createdBy(admin)
                .build());

        taskRepository.save(Task.builder()
                .title("API integration tests")
                .description("Write integration tests for all REST endpoints")
                .status(TaskStatus.TODO)
                .priority(Priority.MEDIUM)
                .progress(0)
                .dueDate(LocalDate.now().plusDays(14))
                .project(portal)
                .assignee(mike)
                .createdBy(admin)
                .build());

        taskRepository.save(Task.builder()
                .title("Define mobile app architecture")
                .description("Choose tech stack and define module structure")
                .status(TaskStatus.IN_PROGRESS)
                .priority(Priority.HIGH)
                .progress(40)
                .dueDate(LocalDate.now().plusDays(10))
                .project(mobile)
                .assignee(jane)
                .createdBy(admin)
                .build());

        taskRepository.save(Task.builder()
                .title("Schema mapping document")
                .description("Map old schema fields to new database tables")
                .status(TaskStatus.TODO)
                .priority(Priority.MEDIUM)
                .progress(0)
                .dueDate(LocalDate.now().plusDays(20))
                .project(migration)
                .assignee(john)
                .createdBy(admin)
                .build());

        log.info("Seeded admin, 3 employees, 3 projects, and 5 tasks");
    }
}
