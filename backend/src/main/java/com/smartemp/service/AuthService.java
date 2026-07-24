package com.smartemp.service;

import com.smartemp.dto.request.LoginRequest;
import com.smartemp.dto.request.RegisterRequest;
import com.smartemp.dto.response.AuthResponse;
import com.smartemp.exception.BadRequestException;
import com.smartemp.mapper.EntityMapper;
import com.smartemp.model.entity.AuditLog;
import com.smartemp.model.entity.User;
import com.smartemp.model.enums.Role;
import com.smartemp.repository.AuditLogRepository;
import com.smartemp.repository.UserRepository;
import com.smartemp.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;
    private final EntityMapper mapper;
    private final AuditLogRepository auditLogRepository;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already registered");
        }

        Role role = request.getRole() != null ? request.getRole() : Role.EMPLOYEE;

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .role(role)
                .department(request.getDepartment())
                .designation(request.getDesignation())
                .phone(request.getPhone())
                .active(true)
                .build();

        user = userRepository.save(user);
        log.info("User registered: {}", user.getEmail());

        auditLogRepository.save(AuditLog.builder()
                .action("REGISTER")
                .entityType("User")
                .entityId(user.getId())
                .performedBy(user.getEmail())
                .details("New user registered with role " + role)
                .build());

        UserDetails userDetails = org.springframework.security.core.userdetails.User
                .withUsername(user.getEmail())
                .password(user.getPassword())
                .roles(user.getRole().name())
                .build();

        String token = jwtTokenProvider.generateToken(userDetails);

        return AuthResponse.builder()
                .token(token)
                .type("Bearer")
                .user(mapper.toUserResponse(user))
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        String token = jwtTokenProvider.generateToken(userDetails);

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadRequestException("User not found"));

        log.info("User logged in: {}", user.getEmail());

        auditLogRepository.save(AuditLog.builder()
                .action("LOGIN")
                .entityType("User")
                .entityId(user.getId())
                .performedBy(user.getEmail())
                .details("User logged in")
                .build());

        return AuthResponse.builder()
                .token(token)
                .type("Bearer")
                .user(mapper.toUserResponse(user))
                .build();
    }
}
