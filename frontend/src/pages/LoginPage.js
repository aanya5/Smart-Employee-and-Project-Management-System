import React, { useState } from 'react';
import { Link as RouterLink, Navigate, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  CircularProgress,
  Link,
  Paper,
  TextField,
  Typography,
  IconButton,
  InputAdornment,
} from '@mui/material';

import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useNotify } from '../context/NotificationContext';

export default function LoginPage() {
  const { login, isAuthenticated, loading } = useAuth();
  const { notify } = useNotify();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  if (isAuthenticated) return <Navigate to="/" replace />;

  const validate = () => {
    const next = {};
    if (!form.email) next.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) next.email = 'Invalid email';
    if (!form.password) next.password = 'Password is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      await login(form.email, form.password);
      notify('Welcome back!', 'success');
      navigate('/');
    } catch (err) {
      notify(err.response?.data?.message || 'Login failed', 'error');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '1.1fr 0.9fr' },
      }}
    >
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'flex-end',
          p: 6,
          background:
            'linear-gradient(160deg, #062830 0%, #0B3D4A 45%, #1A5C6B 100%), radial-gradient(circle at 20% 20%, rgba(196,92,38,0.35), transparent 50%)',
          color: '#F7F4EC',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.04\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          }}
        />
        <Box sx={{ position: 'relative', zIndex: 1, mb: 8 }}>
          <Typography variant="h2" sx={{ mb: 2, maxWidth: 480 }}>
            SmartEmp
          </Typography>
          <Typography variant="h5" sx={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 400, opacity: 0.9, maxWidth: 420 }}>
            Plan projects, assign work, and track delivery in one place.
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3, bgcolor: '#F3F0E8' }}>
        <Paper elevation={0} sx={{ p: { xs: 3, sm: 4 }, width: '100%', maxWidth: 420, border: '1px solid rgba(11,61,74,0.1)' }}>
          <Typography variant="h4" gutterBottom>Sign in</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Use your work email to access the workspace.
          </Typography>
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              fullWidth
              label="Email"
              margin="normal"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              error={Boolean(errors.email)}
              helperText={errors.email}
            />
          <TextField
            fullWidth
            label="Password"
            type={showPassword ? "text" : "password"}
             margin="normal"
             value={form.password}
             onChange={(e) => setForm({ ...form, password: e.target.value })}
             error={Boolean(errors.password)}
             helperText={errors.password}
             InputProps={{
              endAdornment: (
              <InputAdornment position="end">
                <IconButton
                onClick={() => setShowPassword(!showPassword)}
                edge="end"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            
            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ mt: 2, mb: 2, py: 1.2 }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign in'}
            </Button>
            <Typography variant="body2" align="center">
              New here?{' '}
              <Link component={RouterLink} to="/register" underline="hover">
                Create an account
              </Link>
            </Typography>
            <Box sx={{ mt: 3, p: 2, bgcolor: 'rgba(11,61,74,0.05)', borderRadius: 2 }}>
              <Typography variant="caption" display="block" color="text.secondary">
                Demo — Admin: admin@company.com / Admin@123
              </Typography>
              <Typography variant="caption" display="block" color="text.secondary">
                Demo — Employee: john.doe@company.com / Emp@123
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
