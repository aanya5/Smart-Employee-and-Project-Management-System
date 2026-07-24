package com.smartemp.service;

import com.lowagie.text.Document;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.smartemp.dto.response.TaskResponse;
import com.smartemp.exception.ResourceNotFoundException;
import com.smartemp.mapper.EntityMapper;
import com.smartemp.model.entity.Project;
import com.smartemp.model.entity.Task;
import com.smartemp.model.entity.User;
import com.smartemp.model.enums.TaskStatus;
import com.smartemp.repository.ProjectRepository;
import com.smartemp.repository.TaskRepository;
import com.smartemp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final EntityMapper mapper;

    public Map<String, Object> employeeTaskReport(Long employeeId) {
        User user = userRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
        List<TaskResponse> tasks = taskRepository.findByAssigneeId(employeeId).stream()
                .map(mapper::toTaskResponse)
                .collect(Collectors.toList());

        Map<String, Object> report = new HashMap<>();
        report.put("employee", mapper.toUserResponse(user));
        report.put("totalTasks", tasks.size());
        report.put("completed", tasks.stream().filter(t -> t.getStatus() == TaskStatus.COMPLETED).count());
        report.put("pending", tasks.stream().filter(t -> t.getStatus() != TaskStatus.COMPLETED).count());
        report.put("tasks", tasks);
        return report;
    }

    public Map<String, Object> projectProgressReport(Long projectId) {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        String email = authentication.getName();

        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        // Employees can only access projects assigned to them
        if (currentUser.getRole().name().equals("EMPLOYEE")) {

            boolean assigned = taskRepository.findByAssigneeId(currentUser.getId())
                    .stream()
                    .anyMatch(task -> task.getProject() != null &&
                            task.getProject().getId().equals(projectId));

            if (!assigned) {
                throw new ResourceNotFoundException("Project not found");
            }
        }

        List<Task> tasks = taskRepository.findByProjectId(projectId);

        long completed = tasks.stream()
                .filter(t -> t.getStatus() == TaskStatus.COMPLETED)
                .count();

        double progress = tasks.isEmpty()
                ? 0
                : (completed * 100.0 / tasks.size());

        Map<String, Object> report = new HashMap<>();

        report.put("project", mapper.toProjectResponse(project));
        report.put("totalTasks", tasks.size());
        report.put("completedTasks", completed);
        report.put("progressPercent", Math.round(progress * 100.0) / 100.0);
        report.put("tasks",
                tasks.stream()
                        .map(mapper::toTaskResponse)
                        .collect(Collectors.toList()));

        return report;
    }

    public Map<String, Object> pendingTaskReport() {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        String email = authentication.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        List<TaskResponse> pending;

        if (user.getRole().name().equals("ADMIN")) {

            pending = taskRepository.findAll().stream()
                    .filter(t -> t.getStatus() != TaskStatus.COMPLETED)
                    .map(mapper::toTaskResponse)
                    .collect(Collectors.toList());

        } else {

            pending = taskRepository.findByAssigneeId(user.getId()).stream()
                    .filter(t -> t.getStatus() != TaskStatus.COMPLETED)
                    .map(mapper::toTaskResponse)
                    .collect(Collectors.toList());
        }

        Map<String, Object> report = new HashMap<>();

        report.put("totalPending", pending.size());

        report.put("byStatus",
                pending.stream().collect(Collectors.groupingBy(
                        t -> t.getStatus().name(),
                        Collectors.counting())));

        report.put("tasks", pending);

        return report;
    }

    public byte[] exportPendingTasksExcel() throws Exception {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        String email = authentication.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        List<Task> pending;

        if (user.getRole().name().equals("ADMIN")) {

            pending = taskRepository.findAll().stream()
                    .filter(t -> t.getStatus() != TaskStatus.COMPLETED)
                    .collect(Collectors.toList());

        } else {

            pending = taskRepository.findByAssigneeId(user.getId()).stream()
                    .filter(t -> t.getStatus() != TaskStatus.COMPLETED)
                    .collect(Collectors.toList());
        }

        try (XSSFWorkbook workbook = new XSSFWorkbook();
                ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Pending Tasks");
            Row header = sheet.createRow(0);
            String[] cols = { "ID", "Title", "Status", "Priority", "Progress", "Due Date", "Project", "Assignee" };
            for (int i = 0; i < cols.length; i++) {
                header.createCell(i).setCellValue(cols[i]);
            }
            int rowIdx = 1;
            for (Task t : pending) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(t.getId());
                row.createCell(1).setCellValue(t.getTitle());
                row.createCell(2).setCellValue(t.getStatus().name());
                row.createCell(3).setCellValue(t.getPriority().name());
                row.createCell(4).setCellValue(t.getProgress() != null ? t.getProgress() : 0);
                row.createCell(5).setCellValue(t.getDueDate() != null ? t.getDueDate().toString() : "");
                row.createCell(6).setCellValue(t.getProject() != null ? t.getProject().getName() : "");
                row.createCell(7).setCellValue(t.getAssignee() != null ? t.getAssignee().getFullName() : "");
            }
            workbook.write(out);
            return out.toByteArray();
        }
    }

    public byte[] exportEmployeeTasksExcel(Long employeeId) throws Exception {

        User user = userRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));

        List<Task> tasks = taskRepository.findByAssigneeId(employeeId);

        try (XSSFWorkbook workbook = new XSSFWorkbook();
                ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            Sheet sheet = workbook.createSheet("Employee Tasks");

            Row header = sheet.createRow(0);
            String[] cols = {
                    "ID", "Title", "Status", "Priority",
                    "Progress", "Due Date", "Project"
            };

            for (int i = 0; i < cols.length; i++) {
                header.createCell(i).setCellValue(cols[i]);
            }

            Row info = sheet.createRow(1);
            info.createCell(0).setCellValue("Employee");
            info.createCell(1).setCellValue(user.getFullName());

            int rowIdx = 3;

            for (Task t : tasks) {
                Row row = sheet.createRow(rowIdx++);

                row.createCell(0).setCellValue(t.getId());
                row.createCell(1).setCellValue(t.getTitle());
                row.createCell(2).setCellValue(t.getStatus().name());
                row.createCell(3).setCellValue(t.getPriority().name());
                row.createCell(4).setCellValue(t.getProgress() != null ? t.getProgress() : 0);
                row.createCell(5).setCellValue(
                        t.getDueDate() != null ? t.getDueDate().toString() : "");
                row.createCell(6).setCellValue(
                        t.getProject() != null ? t.getProject().getName() : "");
            }

            workbook.write(out);
            return out.toByteArray();
        }
    }

    public byte[] exportProjectTasksExcel(Long projectId) throws Exception {

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        List<Task> tasks = taskRepository.findByProjectId(projectId);

        try (XSSFWorkbook workbook = new XSSFWorkbook();
                ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            Sheet sheet = workbook.createSheet("Project Tasks");

            Row header = sheet.createRow(0);
            String[] cols = {
                    "ID", "Title", "Status", "Priority",
                    "Progress", "Due Date", "Assignee"
            };

            for (int i = 0; i < cols.length; i++) {
                header.createCell(i).setCellValue(cols[i]);
            }

            Row info = sheet.createRow(1);
            info.createCell(0).setCellValue("Project");
            info.createCell(1).setCellValue(project.getName());

            int rowIdx = 3;

            for (Task t : tasks) {

                Row row = sheet.createRow(rowIdx++);

                row.createCell(0).setCellValue(t.getId());
                row.createCell(1).setCellValue(t.getTitle());
                row.createCell(2).setCellValue(t.getStatus().name());
                row.createCell(3).setCellValue(t.getPriority().name());
                row.createCell(4).setCellValue(t.getProgress() != null ? t.getProgress() : 0);
                row.createCell(5).setCellValue(
                        t.getDueDate() != null ? t.getDueDate().toString() : "");
                row.createCell(6).setCellValue(
                        t.getAssignee() != null ? t.getAssignee().getFullName() : "");
            }

            workbook.write(out);
            return out.toByteArray();
        }
    }

    public byte[] exportAllTasksExcel() throws Exception {

        List<Task> tasks = taskRepository.findAll();

        try (XSSFWorkbook workbook = new XSSFWorkbook();
                ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            Sheet sheet = workbook.createSheet("All Tasks");

            Row header = sheet.createRow(0);

            String[] cols = {
                    "ID", "Title", "Status", "Priority",
                    "Progress", "Due Date", "Project", "Assignee"
            };

            for (int i = 0; i < cols.length; i++) {
                header.createCell(i).setCellValue(cols[i]);
            }

            int rowIdx = 1;

            for (Task t : tasks) {

                Row row = sheet.createRow(rowIdx++);

                row.createCell(0).setCellValue(t.getId());
                row.createCell(1).setCellValue(t.getTitle());
                row.createCell(2).setCellValue(t.getStatus().name());
                row.createCell(3).setCellValue(t.getPriority().name());
                row.createCell(4).setCellValue(t.getProgress() != null ? t.getProgress() : 0);
                row.createCell(5).setCellValue(
                        t.getDueDate() != null ? t.getDueDate().toString() : "");
                row.createCell(6).setCellValue(
                        t.getProject() != null ? t.getProject().getName() : "");
                row.createCell(7).setCellValue(
                        t.getAssignee() != null ? t.getAssignee().getFullName() : "");
            }

            workbook.write(out);
            return out.toByteArray();
        }
    }

    public byte[] exportPendingTasksPdf() throws Exception {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        String email = authentication.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        List<Task> pending;

        if (user.getRole().name().equals("ADMIN")) {

            pending = taskRepository.findAll().stream()
                    .filter(t -> t.getStatus() != TaskStatus.COMPLETED)
                    .collect(Collectors.toList());

        } else {

            pending = taskRepository.findByAssigneeId(user.getId()).stream()
                    .filter(t -> t.getStatus() != TaskStatus.COMPLETED)
                    .collect(Collectors.toList());
        }

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document();
        PdfWriter.getInstance(document, out);
        document.open();

        Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16);
        Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 11);
        document.add(new Paragraph("Pending Task Report", titleFont));
        document.add(new Paragraph("Total pending: " + pending.size(), normalFont));
        document.add(new Paragraph(" "));

        PdfPTable table = new PdfPTable(6);
        table.setWidthPercentage(100);
        table.setWidths(new float[] { 1, 3, 2, 2, 2, 2 });

        Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10);
        for (String col : new String[] { "ID", "Title", "Status", "Priority", "Due Date", "Assignee" }) {
            PdfPCell cell = new PdfPCell(new Phrase(col, headerFont));
            cell.setBackgroundColor(new Color(11, 61, 74));
            cell.setPhrase(new Phrase(col, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Color.WHITE)));
            table.addCell(cell);
        }

        for (Task t : pending) {
            table.addCell(String.valueOf(t.getId()));
            table.addCell(t.getTitle());
            table.addCell(t.getStatus().name());
            table.addCell(t.getPriority().name());
            table.addCell(t.getDueDate() != null ? t.getDueDate().toString() : "-");
            table.addCell(t.getAssignee() != null ? t.getAssignee().getFullName() : "-");
        }

        document.add(table);
        document.close();
        return out.toByteArray();
    }

    public byte[] exportEmployeeTasksPdf(Long employeeId) throws Exception {

        User user = userRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));

        List<Task> tasks = taskRepository.findByAssigneeId(employeeId);

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document();

        PdfWriter.getInstance(document, out);
        document.open();

        Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16);
        Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 11);

        document.add(new Paragraph("Employee Task Report", titleFont));
        document.add(new Paragraph("Employee: " + user.getFullName(), normalFont));
        document.add(new Paragraph("Total Tasks: " + tasks.size(), normalFont));
        document.add(new Paragraph(" "));

        PdfPTable table = new PdfPTable(6);
        table.setWidthPercentage(100);
        table.setWidths(new float[] { 1, 3, 2, 2, 2, 2 });

        Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10);

        String[] headers = {
                "ID", "Title", "Status", "Priority", "Due Date", "Project"
        };

        for (String h : headers) {
            PdfPCell cell = new PdfPCell(new Phrase(h, headerFont));
            cell.setBackgroundColor(new Color(11, 61, 74));
            cell.setPhrase(new Phrase(h,
                    FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Color.WHITE)));
            table.addCell(cell);
        }

        for (Task t : tasks) {
            table.addCell(String.valueOf(t.getId()));
            table.addCell(t.getTitle());
            table.addCell(t.getStatus().name());
            table.addCell(t.getPriority().name());
            table.addCell(t.getDueDate() != null ? t.getDueDate().toString() : "-");
            table.addCell(t.getProject() != null ? t.getProject().getName() : "-");
        }

        document.add(table);
        document.close();

        return out.toByteArray();
    }

    public byte[] exportProjectTasksPdf(Long projectId) throws Exception {

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        List<Task> tasks = taskRepository.findByProjectId(projectId);

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document();

        PdfWriter.getInstance(document, out);
        document.open();

        Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16);
        Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 11);

        document.add(new Paragraph("Project Progress Report", titleFont));
        document.add(new Paragraph("Project: " + project.getName(), normalFont));
        document.add(new Paragraph("Total Tasks: " + tasks.size(), normalFont));
        document.add(new Paragraph(" "));

        PdfPTable table = new PdfPTable(6);
        table.setWidthPercentage(100);
        table.setWidths(new float[] { 1, 3, 2, 2, 2, 2 });

        Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10);

        String[] headers = {
                "ID", "Title", "Status", "Priority", "Due Date", "Assignee"
        };

        for (String h : headers) {
            PdfPCell cell = new PdfPCell(new Phrase(h, headerFont));
            cell.setBackgroundColor(new Color(11, 61, 74));
            cell.setPhrase(new Phrase(
                    h,
                    FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Color.WHITE)));
            table.addCell(cell);
        }

        for (Task t : tasks) {
            table.addCell(String.valueOf(t.getId()));
            table.addCell(t.getTitle());
            table.addCell(t.getStatus().name());
            table.addCell(t.getPriority().name());
            table.addCell(t.getDueDate() != null ? t.getDueDate().toString() : "-");
            table.addCell(t.getAssignee() != null ? t.getAssignee().getFullName() : "-");
        }

        document.add(table);
        document.close();

        return out.toByteArray();
    }

    public byte[] exportAllTasksPdf() throws Exception {

        List<Task> tasks = taskRepository.findAll();

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document();

        PdfWriter.getInstance(document, out);
        document.open();

        Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16);
        Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 11);

        document.add(new Paragraph("All Tasks Report", titleFont));
        document.add(new Paragraph("Total Tasks: " + tasks.size(), normalFont));
        document.add(new Paragraph(" "));

        PdfPTable table = new PdfPTable(6);
        table.setWidthPercentage(100);
        table.setWidths(new float[] { 1, 3, 2, 2, 2, 2 });

        Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10);

        String[] headers = {
                "ID", "Title", "Status", "Priority", "Due Date", "Assignee"
        };

        for (String h : headers) {
            PdfPCell cell = new PdfPCell(new Phrase(h, headerFont));
            cell.setBackgroundColor(new Color(11, 61, 74));
            cell.setPhrase(new Phrase(
                    h,
                    FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Color.WHITE)));
            table.addCell(cell);
        }

        for (Task t : tasks) {

            table.addCell(String.valueOf(t.getId()));
            table.addCell(t.getTitle());
            table.addCell(t.getStatus().name());
            table.addCell(t.getPriority().name());
            table.addCell(t.getDueDate() != null ? t.getDueDate().toString() : "-");
            table.addCell(t.getAssignee() != null ? t.getAssignee().getFullName() : "-");
        }

        document.add(table);
        document.close();

        return out.toByteArray();
    }

    public byte[] exportExcel(String type, Long employeeId, Long projectId) throws Exception {

        switch (type.toUpperCase()) {

            case "EMPLOYEE":
                return exportEmployeeTasksExcel(employeeId);

            case "PENDING":
                return exportPendingTasksExcel();

            case "PROJECT":
                return exportProjectTasksExcel(projectId);

            case "ALL":
                return exportAllTasksExcel();

            default:
                return exportPendingTasksExcel();
        }
    }

    public byte[] exportPdf(String type, Long employeeId, Long projectId) throws Exception {

        switch (type.toUpperCase()) {

            case "EMPLOYEE":
                return exportEmployeeTasksPdf(employeeId);

            case "PENDING":
                return exportPendingTasksPdf();

            case "PROJECT":
                return exportProjectTasksPdf(projectId);

            case "ALL":
                return exportAllTasksPdf();

            default:
                return exportPendingTasksPdf();
        }
    }

}
