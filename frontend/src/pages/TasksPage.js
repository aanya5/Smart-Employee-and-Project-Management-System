import React, { useCallback, useEffect, useState } from 'react';
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  MenuItem,
  Paper,
  Slider,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { employeeApi, projectApi, taskApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useNotify } from '../context/NotificationContext';
import StatusChip from '../components/common/StatusChip';

const emptyForm = {
  title: '',
  description: '',
  status: 'TODO',
  priority: 'MEDIUM',
  progress: 0,
  remarks: '',
  dueDate: '',
  projectId: '',
  assigneeId: '',
};

export default function TasksPage() {
  const { isAdmin, user } = useAuth();
  const { notify } = useNotify();
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  
  const [dueFrom, setDueFrom] = useState(null);
  const [dueTo, setDueTo] = useState(null);
  const [open, setOpen] = useState(false);
  const [progressOpen, setProgressOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [progressForm, setProgressForm] = useState({ status: 'TODO', progress: 0, remarks: '' });
  const [errors, setErrors] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        search,
        status: status || undefined,
        priority: priority || undefined,

        dueAfter:
          dueFrom && dueFrom.isValid()
            ? dueFrom.format("YYYY-MM-DD")
            : undefined,

        dueBefore:
          dueTo && dueTo.isValid()
            ? dueTo.format("YYYY-MM-DD")
            : undefined,
        page,
        size,
        sortBy: 'dueDate',
        sortDir: 'asc',
      };
      if (!isAdmin) params.assigneeId = user.id;
      const { data } = await taskApi.search(params);
      setRows(data.data.content);
      setTotal(data.data.totalElements);
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to load tasks', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, status, priority,
    dueFrom,
    dueTo, page, size, isAdmin, user, notify]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    projectApi.search({ size: 100 }).then(({ data }) => setProjects(data.data.content || [])).catch(() => { });
    if (isAdmin) {
      employeeApi.search({ size: 100 }).then(({ data }) => setEmployees(data.data.content || [])).catch(() => { });
    }
  }, [isAdmin]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setErrors({});
    setOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      title: row.title,
      description: row.description || '',
      status: row.status,
      priority: row.priority,
      progress: row.progress || 0,
      remarks: row.remarks || '',
      dueDate: row.dueDate || '',
      projectId: row.projectId || '',
      assigneeId: row.assignee?.id || '',
    });
    setErrors({});
    setOpen(true);
  };

  const openProgress = (row) => {
    setEditing(row);
    setProgressForm({
      status: row.status,
      progress: row.progress || 0,
      remarks: row.remarks || '',
    });
    setProgressOpen(true);
  };

  const validate = () => {
    const next = {};
    if (!form.title) next.title = 'Required';
    if (!form.projectId) next.projectId = 'Required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    const payload = {
      ...form,
      projectId: Number(form.projectId),
      assigneeId: form.assigneeId ? Number(form.assigneeId) : null,
      dueDate: form.dueDate || null,
    };
    try {
      if (editing) {
        await taskApi.update(editing.id, payload);
        notify('Task updated', 'success');
      } else {
        await taskApi.create(payload);
        notify('Task created', 'success');
      }
      setOpen(false);
      load();
    } catch (err) {
      notify(err.response?.data?.message || 'Save failed', 'error');
    }
  };

  const handleProgressSave = async () => {
    try {
      await taskApi.updateProgress(editing.id, progressForm);
      notify('Progress updated', 'success');
      setProgressOpen(false);
      load();
    } catch (err) {
      notify(err.response?.data?.message || 'Update failed', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await taskApi.remove(id);
      notify('Task deleted', 'success');
      load();
    } catch (err) {
      notify(err.response?.data?.message || 'Delete failed', 'error');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="h4">Tasks</Typography>
          <Typography color="text.secondary">
            {isAdmin ? 'Create, assign and monitor tasks across projects.' : 'Update progress and remarks on your assigned tasks.'}
          </Typography>
        </Box>
        {isAdmin && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>New Task</Button>
        )}
      </Box>

    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Paper elevation={0} sx={{ p: 2, mb: 2, border: '1px solid rgba(11,61,74,0.1)', display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField size="small" label="Search" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} sx={{ minWidth: 200 }} />
        <TextField select size="small" label="Status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(0); }} sx={{ minWidth: 150 }}>
          <MenuItem value="">All</MenuItem>
          {['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED', 'BLOCKED'].map((s) => (
            <MenuItem key={s} value={s}>{s.replace('_', ' ')}</MenuItem>
          ))}
        </TextField>
        <TextField select size="small" label="Priority" value={priority} onChange={(e) => { setPriority(e.target.value); setPage(0); }} sx={{ minWidth: 140 }}>
          <MenuItem value="">All</MenuItem>
          {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((p) => (
            <MenuItem key={p} value={p}>{p}</MenuItem>
          ))}
        </TextField>
        

          <DatePicker
            label="Due From"
            value={dueFrom}
            onChange={(newValue) => {
              setDueFrom(newValue);
              setPage(0);
            }}
            
            slotProps={{
              textField: {
                size: "small",
                sx: { minWidth: 180 },
                placeholder: "Select date",
              },
            }}
          />
          <DatePicker
            label="Due To"
            value={dueTo}
            onChange={(newValue) => {
              setDueTo(newValue);
              setPage(0);
            }}
            
            slotProps={{
              textField: {
                size: "small",
                sx: { minWidth: 180 },
                placeholder: "Select date",
              },
            }}
          />

        </Paper>
      </LocalizationProvider>

      <Paper elevation={0} sx={{ border: '1px solid rgba(11,61,74,0.1)' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Project</TableCell>
                  <TableCell>Assignee</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Due</TableCell>
                  <TableCell>Progress</TableCell>
                  <TableCell align="center">Update</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>
                      <Typography fontWeight={600}>{row.title}</Typography>
                      {row.remarks && <Typography variant="caption" color="text.secondary">Remark: {row.remarks}</Typography>}
                    </TableCell>
                    <TableCell>{row.projectName}</TableCell>
                    <TableCell>{row.assignee?.fullName || '-'}</TableCell>
                    <TableCell><StatusChip value={row.status} /></TableCell>
                    <TableCell><StatusChip value={row.priority} /></TableCell>
                    <TableCell>{row.dueDate || '-'}</TableCell>
                    <TableCell sx={{ minWidth: 120 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress variant="determinate" value={row.progress || 0} sx={{ flex: 1, height: 6, borderRadius: 3 }} />
                        <Typography variant="caption">{row.progress || 0}%</Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => openProgress(row)} title="Update progress"><EditOutlinedIcon fontSize="small" /></IconButton>
                      {isAdmin && (
                        <>
                          <IconButton size="small" onClick={() => openEdit(row)}><EditIcon fontSize="small" /></IconButton>
                          <IconButton size="small" color="error" onClick={() => handleDelete(row.id)}><DeleteIcon fontSize="small" /></IconButton>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 && (
                  <TableRow><TableCell colSpan={8} align="center">No tasks found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
            <TablePagination
              component="div"
              count={total}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={size}
              onRowsPerPageChange={(e) => { setSize(parseInt(e.target.value, 10)); setPage(0); }}
            />
          </>
        )}
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>{editing ? 'Edit Task' : 'Create Task'}</DialogTitle>
        <DialogContent sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, pt: '16px !important' }}>
          <TextField label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} error={Boolean(errors.title)} helperText={errors.title} sx={{ gridColumn: '1 / -1' }} />
          <TextField label="Description" multiline minRows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} sx={{ gridColumn: '1 / -1' }} />
          <TextField select label="Project" value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })} error={Boolean(errors.projectId)} helperText={errors.projectId}>
            {projects.map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
          </TextField>
          <TextField select label="Assignee" value={form.assigneeId} onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}>
            <MenuItem value="">Unassigned</MenuItem>
            {employees.map((e) => <MenuItem key={e.id} value={e.id}>{e.fullName}</MenuItem>)}
          </TextField>
          <TextField select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            {['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED', 'BLOCKED'].map((s) => (
              <MenuItem key={s} value={s}>{s.replace('_', ' ')}</MenuItem>
            ))}
          </TextField>
          <TextField select label="Priority" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
            {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
          </TextField>
          <TextField type="date" label="Due date" InputLabelProps={{ shrink: true }} value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
          <TextField type="number" label="Progress %" value={form.progress} onChange={(e) => setForm({ ...form, progress: Number(e.target.value) })} inputProps={{ min: 0, max: 100 }} />
          <TextField label="Remarks" value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} sx={{ gridColumn: '1 / -1' }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>Save</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={progressOpen} onClose={() => setProgressOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Update Progress — {editing?.title}</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <TextField select fullWidth label="Status" margin="normal" value={progressForm.status} onChange={(e) => setProgressForm({ ...progressForm, status: e.target.value })}>
            {['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED', 'BLOCKED'].map((s) => (
              <MenuItem key={s} value={s}>{s.replace('_', ' ')}</MenuItem>
            ))}
          </TextField>
          <Typography gutterBottom sx={{ mt: 2 }}>Progress: {progressForm.progress}%</Typography>
          <Slider value={progressForm.progress} onChange={(_, v) => setProgressForm({ ...progressForm, progress: v })} valueLabelDisplay="auto" />
          <TextField fullWidth label="Remarks" margin="normal" multiline minRows={2} value={progressForm.remarks} onChange={(e) => setProgressForm({ ...progressForm, remarks: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProgressOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleProgressSave}>Update</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
