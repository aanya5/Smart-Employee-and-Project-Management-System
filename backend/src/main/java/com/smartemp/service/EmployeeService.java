package com.smartemp.service;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;
import com.smartemp.dto.request.EmployeeRequest;
import com.smartemp.dto.response.UserResponse;
import com.smartemp.exception.BadRequestException;
import com.smartemp.exception.ResourceNotFoundException;
import com.smartemp.mapper.EntityMapper;
import com.smartemp.model.entity.AuditLog;
import com.smartemp.model.entity.User;
import com.smartemp.model.enums.Role;
import com.smartemp.repository.AuditLogRepository;
import com.smartemp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class EmployeeService {

    private static final Logger log = LoggerFactory.getLogger(EmployeeService.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EntityMapper mapper;
    private final AuditLogRepository auditLogRepository;

    public Page<UserResponse> search(String search, String department, Role role, Pageable pageable) {
        return userRepository.searchEmployees(search, department, role, pageable)
                .map(mapper::toUserResponse);
    }

    public UserResponse getById(Long id) {
        return mapper.toUserResponse(findUser(id));
    }

    public UserResponse getCurrentUser() {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        String email = authentication.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return mapper.toUserResponse(user);
    }

    @Transactional
    public UserResponse create(EmployeeRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already exists");
        }
        if (request.getPassword() == null || request.getPassword().isBlank()) {
            throw new BadRequestException("Password is required for new employees");
        }

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .role(request.getRole() != null ? request.getRole() : Role.EMPLOYEE)
                .department(request.getDepartment())
                .designation(request.getDesignation())
                .phone(request.getPhone())
                .active(request.getActive() != null ? request.getActive() : true)
                .build();

        user = userRepository.save(user);
        log.info("Employee created: {}", user.getEmail());

        auditLogRepository.save(AuditLog.builder()
                .action("CREATE")
                .entityType("Employee")
                .entityId(user.getId())
                .performedBy("ADMIN")
                .details("Employee created: " + user.getEmail())
                .build());

        return mapper.toUserResponse(user);
    }

    @Transactional
    public UserResponse update(Long id, EmployeeRequest request) {
        User user = findUser(id);

        if (!user.getEmail().equals(request.getEmail()) && userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already exists");
        }

        user.setEmail(request.getEmail());
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        if (request.getRole() != null)
            user.setRole(request.getRole());
        user.setDepartment(request.getDepartment());
        user.setDesignation(request.getDesignation());
        user.setPhone(request.getPhone());
        if (request.getActive() != null)
            user.setActive(request.getActive());
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        user = userRepository.save(user);
        log.info("Employee updated: {}", user.getEmail());

        auditLogRepository.save(AuditLog.builder()
                .action("UPDATE")
                .entityType("Employee")
                .entityId(user.getId())
                .performedBy("ADMIN")
                .details("Employee updated: " + user.getEmail())
                .build());

        return mapper.toUserResponse(user);
    }

    @Transactional
    public UserResponse uploadProfile(Long id, MultipartFile file) {

        User user = findUser(id);

        if (file.isEmpty()) {
            throw new BadRequestException("Please select an image");
        }

        try {
            String uploadDir = "uploads/profile-images/";
            Files.createDirectories(Paths.get(uploadDir));

            String fileName = UUID.randomUUID() + "_" + file.getOriginalFilename();
            Path filePath = Paths.get(uploadDir, fileName);

            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
            System.out.println("✔ File copied");

            user.setProfileImage(fileName);
            System.out.println("✔ Profile image set");

            user = userRepository.save(user);
            System.out.println("✔ User saved");

            auditLogRepository.save(AuditLog.builder()
                    .action("UPLOAD_PROFILE")
                    .entityType("Employee")
                    .entityId(user.getId())
                    .performedBy("ADMIN")
                    .details("Uploaded profile image for " + user.getEmail())
                    .build());
            System.out.println("✔ Audit saved");

            return mapper.toUserResponse(user);

        } catch (Exception e) {
            e.printStackTrace(); // <-- This is important
            throw new RuntimeException("Failed to upload image", e);
        }
    }

    @Transactional
    public UserResponse uploadCurrentUserProfile(MultipartFile file) {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        String email = authentication.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (file.isEmpty()) {
            throw new BadRequestException("Please select an image");
        }

        try {
            String uploadDir = "uploads/profile-images/";
            Files.createDirectories(Paths.get(uploadDir));

            String fileName = UUID.randomUUID() + "_" + file.getOriginalFilename();
            Path filePath = Paths.get(uploadDir, fileName);

            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            user.setProfileImage(fileName);

            user = userRepository.save(user);

            auditLogRepository.save(AuditLog.builder()
                    .action("UPLOAD_PROFILE")
                    .entityType("Employee")
                    .entityId(user.getId())
                    .performedBy(user.getEmail())
                    .details("User updated their own profile image")
                    .build());

            return mapper.toUserResponse(user);

        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Failed to upload image", e);
        }
    }

    @Transactional
    public UserResponse removeCurrentUserProfile() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        String email = authentication.getName();

    User user = userRepository.findByEmail(email)
            .orElseThrow(() ->
                    new ResourceNotFoundException("User not found"));

    if (user.getProfileImage() != null) {
        try {
            Path filePath = Paths.get("uploads/profile-images", user.getProfileImage());
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    user.setProfileImage(null);

    user = userRepository.save(user);

    auditLogRepository.save(AuditLog.builder()
            .action("REMOVE_PROFILE")
            .entityType("Employee")
            .entityId(user.getId())
            .performedBy(user.getEmail())
            .details("User removed their profile image")
            .build());

    return mapper.toUserResponse(user);
}

    @Transactional
    public void delete(Long id) {
        User user = findUser(id);
        userRepository.delete(user);
        log.info("Employee deleted: {}", user.getEmail());

        auditLogRepository.save(AuditLog.builder()
                .action("DELETE")
                .entityType("Employee")
                .entityId(id)
                .performedBy("ADMIN")
                .details("Employee deleted: " + user.getEmail())
                .build());
    }

    private User findUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + id));
    }
}
