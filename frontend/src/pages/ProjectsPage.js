import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Paper,
  Select,
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
import { employeeApi, projectApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useNotify } from '../context/NotificationContext';
import StatusChip from '../components/common/StatusChip';
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

const emptyForm = {
  name: '',
  description: '',
  status: 'PLANNING',
  priority: 'MEDIUM',
  startDate: '',
  deadline: '',
  managerId: '',
  employeeIds: [],
};

export default function ProjectsPage() {
  const { isAdmin, user } = useAuth();
  const { notify } = useNotify();
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [projectView, setProjectView] = useState("ALL");
  const [deadlineFrom, setDeadlineFrom] = useState(null);
  const [deadlineTo, setDeadlineTo] = useState(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await projectApi.search({
        search,
        status: status || undefined,
        priority: priority || undefined,

        deadlineFrom:
          deadlineFrom && deadlineFrom.isValid()
            ? deadlineFrom.format("YYYY-MM-DD")
            : undefined,

        deadlineTo:
          deadlineTo && deadlineTo.isValid()
            ? deadlineTo.format("YYYY-MM-DD")
            : undefined,

        page,
        size,
        sortBy: "id",
        sortDir: "desc",
      });
      setRows(data.data.content);
      setTotal(data.data.totalElements);
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to load projects', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, status, priority, deadlineFrom, deadlineTo, page, size, notify]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!isAdmin) return;
    employeeApi.search({ size: 100 }).then(({ data }) => {
      setEmployees(data.data.content || []);
    }).catch(() => { });
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
      name: row.name,
      description: row.description || '',
      status: row.status,
      priority: row.priority,
      startDate: row.startDate || '',
      deadline: row.deadline || '',
      managerId: row.manager?.id || '',
      employeeIds: (row.employees || []).map((e) => e.id),
    });
    setErrors({});
    setOpen(true);
  };

  const validate = () => {
    const next = {};
    if (!form.name) next.name = 'Required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    const payload = {
      ...form,
      managerId: form.managerId || null,
      startDate: form.startDate || null,
      deadline: form.deadline || null,
    };
    try {
      if (editing) {
        await projectApi.update(editing.id, payload);
        notify('Project updated', 'success');
      } else {
        await projectApi.create(payload);
        notify('Project created', 'success');
      }
      setOpen(false);
      load();
    } catch (err) {
      notify(err.response?.data?.message || 'Save failed', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this project?')) return;
    try {
      await projectApi.remove(id);
      notify('Project deleted', 'success');
      load();
    } catch (err) {
      notify(err.response?.data?.message || 'Delete failed', 'error');
    }
  };

  const displayedRows =
    !isAdmin && projectView === "MINE"
      ? rows.filter(project =>
        project.employees?.some(emp => emp.id === user?.id)
      )
      : rows;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="h4">Projects</Typography>
          <Typography color="text.secondary">Track status, priority, deadlines and team assignment.</Typography>
        </Box>
        {isAdmin && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>New Project</Button>
        )}
      </Box>
      <LocalizationProvider dateAdapter={AdapterDayjs}>

        <Paper elevation={0} sx={{ p: 2, mb: 2, border: '1px solid rgba(11,61,74,0.1)', display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField size="small" label="Search" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} sx={{ minWidth: 200 }} />
          <TextField select size="small" label="Status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(0); }} sx={{ minWidth: 160 }}>
            <MenuItem value="">All</MenuItem>
            {['PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED'].map((s) => (
              <MenuItem key={s} value={s}>{s.replace('_', ' ')}</MenuItem>
            ))}
          </TextField>
          <TextField select size="small" label="Priority" value={priority} onChange={(e) => { setPriority(e.target.value); setPage(0); }} sx={{ minWidth: 140 }}>
            <MenuItem value="">All</MenuItem>
            {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((p) => (
              <MenuItem key={p} value={p}>{p}</MenuItem>
            ))}
          </TextField>

          {!isAdmin && (
            <TextField
              select
              size="small"
              label="View"
              value={projectView}
              onChange={(e) => setProjectView(e.target.value)}
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="ALL">All Projects</MenuItem>
              <MenuItem value="MINE">Assigned to Me</MenuItem>
            </TextField>
          )}

          <DatePicker
            label="Deadline From"
            value={deadlineFrom}
            onChange={(newValue) => {
              setDeadlineFrom(newValue);
              setPage(0);
            }}
            slotProps={{
              textField: {
                size: "small",
                sx: { minWidth: 180 },
                InputProps: {
                  readOnly: true,
                },
              },
            }}
          />

          <DatePicker
            label="Deadline To"
            value={deadlineTo}
            onChange={(newValue) => {
              setDeadlineTo(newValue);
              setPage(0);
            }}
            slotProps={{
              textField: {
                size: "small",
                sx: { minWidth: 180 },
                InputProps: {
                  readOnly: true,
                },
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
                  <TableCell>Name</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Deadline</TableCell>
                  <TableCell>Team</TableCell>
                  <TableCell>Tasks</TableCell>
                  {isAdmin && <TableCell align="right">Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {displayedRows.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>
                      <Typography fontWeight={600}>{row.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{row.description?.slice(0, 60)}</Typography>
                    </TableCell>
                    <TableCell><StatusChip value={row.status} /></TableCell>
                    <TableCell><StatusChip value={row.priority} /></TableCell>
                    <TableCell>{row.deadline || '-'}</TableCell>
                    <TableCell>{row.employees?.length || 0}</TableCell>
                    <TableCell>{row.completedTaskCount}/{row.taskCount}</TableCell>
                    {isAdmin && (
                      <TableCell align="right">
                        <IconButton size="small" onClick={() => openEdit(row)}><EditIcon fontSize="small" /></IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDelete(row.id)}><DeleteIcon fontSize="small" /></IconButton>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                {displayedRows.length === 0 && (
                  <TableRow><TableCell colSpan={7} align="center">No projects found</TableCell></TableRow>
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
        <DialogTitle>{editing ? 'Edit Project' : 'Create Project'}</DialogTitle>
        <DialogContent sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, pt: '16px !important' }}>
          <TextField label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={Boolean(errors.name)} helperText={errors.name} sx={{ gridColumn: '1 / -1' }} />
          <TextField label="Description" multiline minRows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} sx={{ gridColumn: '1 / -1' }} />
          <TextField select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            {['PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED'].map((s) => (
              <MenuItem key={s} value={s}>{s.replace('_', ' ')}</MenuItem>
            ))}
          </TextField>
          <TextField select label="Priority" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
            {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((p) => (
              <MenuItem key={p} value={p}>{p}</MenuItem>
            ))}
          </TextField>
          <TextField type="date" label="Start date" InputLabelProps={{ shrink: true }} value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
          <TextField type="date" label="Deadline" InputLabelProps={{ shrink: true }} value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
          <TextField select label="Manager" value={form.managerId} onChange={(e) => setForm({ ...form, managerId: e.target.value })}>
            <MenuItem value="">None</MenuItem>
            {employees.map((e) => (
              <MenuItem key={e.id} value={e.id}>{e.fullName}</MenuItem>
            ))}
          </TextField>
          <FormControl>
            <InputLabel>Assign employees</InputLabel>
            <Select
              multiple
              value={form.employeeIds}
              onChange={(e) => setForm({ ...form, employeeIds: e.target.value })}
              input={<OutlinedInput label="Assign employees" />}
              renderValue={(selected) =>
                employees.filter((e) => selected.includes(e.id)).map((e) => e.fullName).join(', ')
              }
            >
              {employees.map((e) => (
                <MenuItem key={e.id} value={e.id}>
                  <Checkbox checked={form.employeeIds.indexOf(e.id) > -1} />
                  <ListItemText primary={e.fullName} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
