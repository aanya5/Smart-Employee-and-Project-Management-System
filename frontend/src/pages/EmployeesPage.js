import React, { useCallback, useEffect, useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  TextField,
  Typography,
  CircularProgress,
} from '@mui/material';
import UploadIcon from '@mui/icons-material/Upload';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { employeeApi } from '../api/client';
import { useNotify } from '../context/NotificationContext';

const emptyForm = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  department: '',
  designation: '',
  phone: '',
  role: 'EMPLOYEE',
  active: true,
};

export default function EmployeesPage() {
  const { notify } = useNotify();
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [sortBy, setSortBy] = useState('id');
  const [sortDir, setSortDir] = useState('asc');
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [profileFile, setProfileFile] = useState(null);
  const [errors, setErrors] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await employeeApi.search({
        search, department, page, size, sortBy, sortDir,
      });
      setRows(data.data.content);
      setTotal(data.data.totalElements);
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to load employees', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, department, page, size, sortBy, sortDir, notify]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setProfileFile(null);
    setErrors({});
    setOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      firstName: row.firstName,
      lastName: row.lastName,
      email: row.email,
      password: '',
      department: row.department || '',
      designation: row.designation || '',
      phone: row.phone || '',
      role: row.role,
      active: row.active,
    });
    setProfileFile(null);
    setErrors({});
    setOpen(true);
  };

  const validate = () => {
    const next = {};
    if (!form.firstName) next.firstName = 'Required';
    if (!form.lastName) next.lastName = 'Required';
    if (!form.email) next.email = 'Required';
    if (!editing && (!form.password || form.password.length < 6)) next.password = 'Min 6 characters';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    try {
      let employee;

      if (editing) {
        const { data } = await employeeApi.update(editing.id, form);
        employee = data.data;

        if (profileFile) {
          await employeeApi.uploadProfile(editing.id, profileFile);
        }

        notify("Employee updated", "success");
      } else {
        const { data } = await employeeApi.create(form);
        employee = data.data;

        if (profileFile) {
          await employeeApi.uploadProfile(employee.id, profileFile);
        }

        notify("Employee created", "success");
      }

      setOpen(false);
      load();

    } catch (err) {
      notify(err.response?.data?.message || "Save failed", "error");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this employee?')) return;
    try {
      await employeeApi.remove(id);
      notify('Employee deleted', 'success');
      load();
    } catch (err) {
      notify(err.response?.data?.message || 'Delete failed', 'error');
    }
  };

  const toggleSort = (field) => {
    if (sortBy === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortBy(field);
      setSortDir('asc');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="h4">Employees</Typography>
          <Typography color="text.secondary">Add, update, search and manage team members.</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>Add Employee</Button>
      </Box>

      <Paper elevation={0} sx={{ p: 2, mb: 2, border: '1px solid rgba(11,61,74,0.1)', display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField size="small" label="Search" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} sx={{ minWidth: 220 }} />
        <TextField size="small" label="Department" value={department} onChange={(e) => { setDepartment(e.target.value); setPage(0); }} sx={{ minWidth: 180 }} />
      </Paper>

      <Paper elevation={0} sx={{ border: '1px solid rgba(11,61,74,0.1)' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  {['Name', 'email', 'department', 'designation', 'role'].map((col) => (
                    <TableCell key={col}>
                      <TableSortLabel active={sortBy === col} direction={sortBy === col ? sortDir : 'asc'} onClick={() => toggleSort(col)}>
                        {col.charAt(0).toUpperCase() + col.slice(1)}
                      </TableSortLabel>
                    </TableCell>
                  ))}
                    <TableCell>Active</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                          <Avatar
                            src={
                              row.profileImage
                                ? `http://localhost:8080/uploads/profile-images/${row.profileImage}`
                                : undefined
                            }
                            sx={{ width: 48, height: 48 }}
                          >
                            {!row.profileImage &&
                              `${row.firstName?.charAt(0) || ""}${row.lastName?.charAt(0) || ""}`}
                          </Avatar>

                          <Typography>{row.fullName}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{row.email}</TableCell>
                      <TableCell>{row.department || '-'}</TableCell>
                      <TableCell>{row.designation || '-'}</TableCell>
                    <TableCell>{row.role}</TableCell>
                    <TableCell>{row.active ? 'Yes' : 'No'}</TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => openEdit(row)}><EditIcon fontSize="small" /></IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDelete(row.id)}><DeleteIcon fontSize="small" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 && (
                  <TableRow><TableCell colSpan={7} align="center">No employees found</TableCell></TableRow>
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

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editing ? 'Edit Employee' : 'Add Employee'}</DialogTitle>
        <DialogContent sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, pt: '16px !important' }}>
          <TextField label="First name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} error={Boolean(errors.firstName)} helperText={errors.firstName} />
          <TextField label="Last name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} error={Boolean(errors.lastName)} helperText={errors.lastName} />
          <TextField label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={Boolean(errors.email)} helperText={errors.email} sx={{ gridColumn: '1 / -1' }} />
          <TextField label={editing ? 'New password (optional)' : 'Password'} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} error={Boolean(errors.password)} helperText={errors.password} sx={{ gridColumn: '1 / -1' }} />
          <TextField label="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
          <TextField label="Designation" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} />
          <TextField label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Box
            sx={{
              gridColumn: "1 / -1",
              display: "flex",
              alignItems: "center",
              gap: 2,
              mt: 1,
            }}
          >
            <Avatar
              src={profileFile ? URL.createObjectURL(profileFile) : undefined}
              sx={{ width: 64, height: 64 }}
            >
              {!profileFile &&
                `${form.firstName?.charAt(0) || ""}${form.lastName?.charAt(0) || ""}`}
            </Avatar>

            <Box>
              <Button
                variant="outlined"
                component="label"
                startIcon={<UploadIcon />}
              >
                Upload Photo

                <input
                  hidden
                  type="file"
                  accept="image/*"
                  onChange={(e) => setProfileFile(e.target.files[0])}
                />
              </Button>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 1 }}
              >
                {profileFile
                  ? profileFile.name
                  : "No profile picture selected"}
              </Typography>
            </Box>
          </Box>

          <TextField select label="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <MenuItem value="EMPLOYEE">Employee</MenuItem>
            <MenuItem value="ADMIN">Admin</MenuItem>
          </TextField>
          <FormControlLabel
            control={<Switch checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />}
            label="Active"
            sx={{ gridColumn: '1 / -1' }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
