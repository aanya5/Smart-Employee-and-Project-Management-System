package com.smartemp.dto.request;

import com.smartemp.model.enums.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class EmployeeRequest {
    @NotBlank
    @Email
    private String email;

    private String password;

    @NotBlank
    private String firstName;

    @NotBlank
    private String lastName;

    private Role role = Role.EMPLOYEE;
    private String department;
    private String designation;
    private String phone;
    private Boolean active = true;
}
