package com.smartemp.controller;

import com.smartemp.dto.response.ApiResponse;
import com.smartemp.dto.response.DashboardResponse;
import com.smartemp.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<DashboardResponse>> adminDashboard() {
        return ResponseEntity.ok(ApiResponse.ok(dashboardService.getAdminDashboard()));
    }

    @GetMapping("/employee")
    public ResponseEntity<ApiResponse<DashboardResponse>> employeeDashboard(Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.ok(
                dashboardService.getEmployeeDashboard(authentication.getName())));
    }
}
