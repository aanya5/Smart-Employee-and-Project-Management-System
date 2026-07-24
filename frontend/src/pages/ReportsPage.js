import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { employeeApi, projectApi, reportApi } from '../api/client';
import { useNotify } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import StatusChip from '../components/common/StatusChip';

function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(new Blob([blob]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const { notify } = useNotify();
  const { isAdmin, user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [employeeId, setEmployeeId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [reportType, setReportType] = useState(
    isAdmin ? "ALL" : "PENDING"
  );
  const [employeeReport, setEmployeeReport] = useState(null);
  const [projectReport, setProjectReport] = useState(null);
  const [pendingReport, setPendingReport] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      employeeApi.search({ size: 100, role: 'EMPLOYEE' })
        .then(({ data }) => setEmployees(data.data.content || []))
        .catch(() => { });
    }
    projectApi.search({ size: 100 })
      .then(({ data }) => {
        const allProjects = data.data.content || [];

        if (isAdmin) {
          setProjects(allProjects);
        } else {
          const assignedProjects = allProjects.filter(project =>
            project.employees?.some(emp => emp.id === user.id)
          );

          setProjects(assignedProjects);
        }
      })
      .catch((err) => {
        console.error(err);
      });
    reportApi.pending().then(({ data }) => setPendingReport(data.data)).catch(() => { });
  }, []);

  const loadEmployeeReport = async () => {
    const id = isAdmin ? employeeId : user.id;

    if (!id) return;
    setLoading(true);
    try {
      const { data } = await reportApi.employee(id);
      setEmployeeReport(data.data);
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to load report', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadProjectReport = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const { data } = await reportApi.project(projectId);
      setProjectReport(data.data);
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to load report', 'error');
    } finally {
      setLoading(false);
    }
  };

  const exportExcel = async () => {
    try {
      const { data } = await reportApi.exportExcel({
        type: reportType,
        employeeId: employeeId || undefined,
        projectId: projectId || undefined,
      });

      downloadBlob(data, `${reportType.toLowerCase()}-report.xlsx`);
      notify("Excel exported", "success");
    } catch {
      notify("Excel export failed", "error");
    }
  };
  const exportPdf = async () => {
    try {
      const { data } = await reportApi.exportPdf({
        type: reportType,
        employeeId: employeeId || undefined,
        projectId: projectId || undefined,
      });

      downloadBlob(data, `${reportType.toLowerCase()}-report.pdf`);
      notify("PDF exported", "success");
    } catch {
      notify("PDF export failed", "error");
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="h4">Reports</Typography>
          <Typography color="text.secondary">Employee-wise, project progress, and pending task reports.</Typography>
        </Box>
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <TextField
            select
            size="small"
            label="Report"
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            sx={{ minWidth: 230 }}
          >
            {isAdmin && (
              <MenuItem value="ALL">All Reports</MenuItem>
            )}
            <MenuItem value="PENDING">Pending Task Report</MenuItem>
            {isAdmin && (
              <MenuItem value="EMPLOYEE">
                Employee-wise Task Report
              </MenuItem>
            )}
            <MenuItem value="PROJECT">Project Progress Report</MenuItem>
          </TextField>

          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={exportExcel}
            disabled={
              (reportType === "EMPLOYEE" && !employeeId) ||
              (reportType === "PROJECT" && !projectId)
            }
          >
            Export Excel
          </Button>

          <Button
            variant="contained"
            startIcon={<PictureAsPdfIcon />}
            onClick={exportPdf}
            disabled={
              (reportType === "EMPLOYEE" && !employeeId) ||
              (reportType === "PROJECT" && !projectId)
            }
          >
            Export PDF
          </Button>
        </Box>
      </Box>

      <Paper elevation={0} sx={{ p: 2.5, mb: 2.5, border: '1px solid rgba(11,61,74,0.1)' }}>
        <Typography variant="h6" gutterBottom>Pending Task Report</Typography>
        {pendingReport ? (
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Total pending: <strong>{pendingReport.totalPending}</strong>
            {pendingReport.byStatus && Object.entries(pendingReport.byStatus).map(([k, v]) => ` · ${k}: ${v}`).join('')}
          </Typography>
        ) : (
          <CircularProgress size={20} />
        )}
        {pendingReport?.tasks && (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Task</TableCell>
                <TableCell>Project</TableCell>
                <TableCell>Assignee</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Due</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pendingReport.tasks.slice(0, 10).map((t) => (
                <TableRow key={t.id}>
                  <TableCell>{t.title}</TableCell>
                  <TableCell>{t.projectName}</TableCell>
                  <TableCell>{t.assignee?.fullName || '-'}</TableCell>
                  <TableCell><StatusChip value={t.status} /></TableCell>
                  <TableCell><StatusChip value={t.priority} /></TableCell>
                  <TableCell>{t.dueDate || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>

      {isAdmin && (
        <Paper elevation={0} sx={{ p: 2.5, mb: 2.5, border: '1px solid rgba(11,61,74,0.1)' }}>
          <Typography variant="h6" gutterBottom>Employee-wise Task Report</Typography>
          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <TextField select size="small" label="Employee" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} sx={{ minWidth: 240 }}>
              {employees.map((e) => <MenuItem key={e.id} value={e.id}>{e.fullName}</MenuItem>)}
            </TextField>
            <Button variant="contained" onClick={loadEmployeeReport} disabled={!employeeId || loading}>Generate</Button>
          </Box>
          {employeeReport && (
            <Box>
              <Typography variant="body2" sx={{ mb: 1 }}>
                {employeeReport.employee?.fullName} — Total: {employeeReport.totalTasks}, Completed: {employeeReport.completed}, Pending: {employeeReport.pending}
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Task</TableCell>
                    <TableCell>Project</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Progress</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(employeeReport.tasks || []).map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>{t.title}</TableCell>
                      <TableCell>{t.projectName}</TableCell>
                      <TableCell><StatusChip value={t.status} /></TableCell>
                      <TableCell>{t.progress}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
        </Paper>
      )}

      <Paper elevation={0} sx={{ p: 2.5, border: '1px solid rgba(11,61,74,0.1)' }}>
        <Typography variant="h6" gutterBottom>Project Progress Report</Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
          <TextField select size="small" label="Project" value={projectId} onChange={(e) => setProjectId(e.target.value)} sx={{ minWidth: 240 }}>
            {projects.map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
          </TextField>
          <Button variant="contained" onClick={loadProjectReport} disabled={!projectId || loading}>Generate</Button>
        </Box>
        {projectReport && (
          <Box>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {projectReport.project?.name} — Progress: {projectReport.progressPercent}% ({projectReport.completedTasks}/{projectReport.totalTasks} tasks)
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Task</TableCell>
                  <TableCell>Assignee</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Progress</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(projectReport.tasks || []).map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>{t.title}</TableCell>
                    <TableCell>{t.assignee?.fullName || '-'}</TableCell>
                    <TableCell><StatusChip value={t.status} /></TableCell>
                    <TableCell>{t.progress}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </Paper>
    </Box>
  );
}
