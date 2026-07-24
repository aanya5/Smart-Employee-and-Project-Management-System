package com.smartemp.dto.response;

import com.smartemp.model.enums.Role;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class UserResponse {
    private Long id;
    private String email;
    private String firstName;
    private String lastName;
    private String fullName;
    private Role role;
    private String department;
    private String designation;
    private String phone;
    private String profileImage;
    private boolean active;
    private LocalDateTime createdAt;
}
