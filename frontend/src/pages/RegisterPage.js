import React, { useState } from 'react';
import { Link as RouterLink, Navigate, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  CircularProgress,
  Link,
  MenuItem,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useNotify } from '../context/NotificationContext';

export default function RegisterPage() {
  const { register, isAuthenticated, loading } = useAuth();
  const { notify } = useNotify();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    department: '',
    designation: '',
    phone: '',
    role: 'EMPLOYEE',
  });
  const [errors, setErrors] = useState({});

  if (isAuthenticated) return <Navigate to="/" replace />;

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const validate = () => {
    const next = {};
    if (!form.firstName) next.firstName = 'Required';
    if (!form.lastName) next.lastName = 'Required';
    if (!form.email) next.email = 'Required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) next.email = 'Invalid email';
    if (!form.password || form.password.length < 6) next.password = 'Min 6 characters';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      await register(form);
      notify('Account created successfully', 'success');
      navigate('/');
    } catch (err) {
      notify(err.response?.data?.message || 'Registration failed', 'error');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3, bgcolor: '#F3F0E8' }}>
      <Paper elevation={0} sx={{ p: 4, width: '100%', maxWidth: 560, border: '1px solid rgba(11,61,74,0.1)' }}>
        <Typography variant="h4" gutterBottom>Create account</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Join SmartEmp to manage your projects and tasks.
        </Typography>
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <TextField name="firstName" label="First name" value={form.firstName} onChange={onChange} error={Boolean(errors.firstName)} helperText={errors.firstName} />
            <TextField name="lastName" label="Last name" value={form.lastName} onChange={onChange} error={Boolean(errors.lastName)} helperText={errors.lastName} />
            <TextField name="email" label="Email" value={form.email} onChange={onChange} error={Boolean(errors.email)} helperText={errors.email} sx={{ gridColumn: '1 / -1' }} />
            <TextField name="password" label="Password" type="password" value={form.password} onChange={onChange} error={Boolean(errors.password)} helperText={errors.password} sx={{ gridColumn: '1 / -1' }} />
            <TextField name="department" label="Department" value={form.department} onChange={onChange} />
            <TextField name="designation" label="Designation" value={form.designation} onChange={onChange} />
            <TextField name="phone" label="Phone" value={form.phone} onChange={onChange} />
            <TextField select name="role" label="Role" value={form.role} onChange={onChange}>
              <MenuItem value="EMPLOYEE">Employee</MenuItem>
              <MenuItem value="ADMIN">Admin</MenuItem>
            </TextField>
          </Box>
          <Button fullWidth type="submit" variant="contained" size="large" disabled={loading} sx={{ mt: 3, mb: 2, py: 1.2 }}>
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Register'}
          </Button>
          <Typography variant="body2" align="center">
            Already have an account?{' '}
            <Link component={RouterLink} to="/login" underline="hover">Sign in</Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
