package com.smartemp.controller;

import com.smartemp.dto.response.ApiResponse;
import com.smartemp.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/employee/{employeeId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> employeeTaskReport(
            @PathVariable Long employeeId) {

        return ResponseEntity.ok(
                ApiResponse.ok(reportService.employeeTaskReport(employeeId))
        );
    }

    @GetMapping("/project/{projectId}")
    @PreAuthorize("hasAnyRole('ADMIN','EMPLOYEE')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> projectProgressReport(
            @PathVariable Long projectId) {

        return ResponseEntity.ok(
                ApiResponse.ok(reportService.projectProgressReport(projectId))
        );
    }

    @GetMapping("/pending")
    @PreAuthorize("hasAnyRole('ADMIN','EMPLOYEE')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> pendingTaskReport() {

        return ResponseEntity.ok(
                ApiResponse.ok(reportService.pendingTaskReport())
        );
    }

    @GetMapping("/export/excel")
    @PreAuthorize("hasAnyRole('ADMIN','EMPLOYEE')")
    public ResponseEntity<byte[]> exportExcel(
            @RequestParam String type,
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) Long projectId) throws Exception {

        byte[] data = reportService.exportExcel(type, employeeId, projectId);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=" + type.toLowerCase() + "-report.xlsx")
                .contentType(MediaType.parseMediaType(
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(data);
    }

    @GetMapping("/export/pdf")
    @PreAuthorize("hasAnyRole('ADMIN','EMPLOYEE')")
    public ResponseEntity<byte[]> exportPdf(
            @RequestParam String type,
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) Long projectId) throws Exception {

        byte[] data = reportService.exportPdf(type, employeeId, projectId);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=" + type.toLowerCase() + "-report.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(data);
    }
}
