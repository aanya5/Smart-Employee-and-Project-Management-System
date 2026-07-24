import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Switch,
  useMediaQuery,
  useTheme,
} from '@mui/material';

import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import FolderIcon from '@mui/icons-material/Folder';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AssessmentIcon from '@mui/icons-material/Assessment';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';

import { useAuth } from '../../context/AuthContext';
import { useThemeMode } from '../../context/ThemeContext';

const drawerWidth = 260;

const navItems = [
  { label: 'Dashboard', path: '/', icon: <DashboardIcon />, roles: ['ADMIN', 'EMPLOYEE'] },
  { label: 'Employees', path: '/employees', icon: <PeopleIcon />, roles: ['ADMIN'] },
  { label: 'Projects', path: '/projects', icon: <FolderIcon />, roles: ['ADMIN', 'EMPLOYEE'] },
  { label: 'Tasks', path: '/tasks', icon: <AssignmentIcon />, roles: ['ADMIN', 'EMPLOYEE'] },
  { label: 'My Profile', path: '/profile', icon: <PersonIcon />, roles: ['ADMIN', 'EMPLOYEE'] },
  { label: 'Reports', path: '/reports', icon: <AssessmentIcon />, roles: ['ADMIN', 'EMPLOYEE'] },
];

export default function AppLayout() {
  const { user, logout, isAdmin } = useAuth();
  const { mode, toggleTheme } = useThemeMode();

  const navigate = useNavigate();
  const location = useLocation();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const visibleNav = navItems.filter(item => item.roles.includes(user?.role));

  const drawer = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'primary.main',
        color: 'primary.contrastText',
      }}
    >
      <Box sx={{ px: 3, py: 3 }}>
        <Typography
          variant="h5"
          sx={{
            color: '#F7F4EC',
            letterSpacing: '-0.02em',
          }}
        >
          SmartEmp
        </Typography>

        <Typography
          variant="body2"
          sx={{
            color: 'rgba(247,244,236,0.7)',
            mt: 0.5,
          }}
        >
          Employee & Project Hub
        </Typography>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)' }} />

      <List sx={{ flex: 1, px: 1.5, py: 2 }}>
        {visibleNav.map(item => {
          const selected = location.pathname === item.path;

          return (
            <ListItemButton
              key={item.path}
              selected={selected}
              onClick={() => {
                navigate(item.path);
                setMobileOpen(false);
              }}
              sx={{
                mb: 0.5,
                borderRadius: 2,
                color: selected ? '#FFF' : 'rgba(247,244,236,0.85)',
                bgcolor: selected ? 'rgba(196,92,38,0.9)' : 'transparent',
                '&.Mui-selected:hover': {
                  bgcolor: 'rgba(196,92,38,1)',
                },
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.08)',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: 'inherit',
                  minWidth: 40,
                }}
              >
                {item.icon}
              </ListItemIcon>

              <ListItemText primary={item.label} />
            </ListItemButton>
          );
        })}
      </List>

      <Box sx={{ p: 2 }}>
        <Typography
          variant="caption"
          sx={{
            color: 'rgba(247,244,236,0.55)',
          }}
        >
          {isAdmin ? 'Admin workspace' : 'Employee workspace'}
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          bgcolor: 'background.paper',
          color: 'text.primary',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Toolbar>
          {isMobile && (
            <IconButton
              edge="start"
              onClick={() => setMobileOpen(!mobileOpen)}
              sx={{ mr: 1 }}
            >
              <MenuIcon />
            </IconButton>
          )}

          <Typography
            variant="h6"
            sx={{
              flexGrow: 1,
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 700,

            }}
          >
            {visibleNav.find(n => n.path === location.pathname)?.label || 'Dashboard'}
          </Typography>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              mr: 2,
            }}
          >
            <Typography
              variant="caption"
              sx={{
                mr: 1,
                color: 'text.secondary',
                fontWeight: 500,
              }}
            >
              Dark
            </Typography>

            <Switch
              checked={mode === 'dark'}
              onChange={toggleTheme}
              color="default"
              sx={{
                '& .MuiSwitch-switchBase.Mui-checked': {
                  color: '#C45C26',
                },

                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                  backgroundColor: '#C45C26',
                },
                '& .MuiSwitch-track': {
                  borderRadius: 10,
                },
              }}
            />
          </Box>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              px: 1.25,
              py: 0.75,
              borderRadius: 3,
              cursor: 'pointer',
              transition: 'all .2s ease',

              '&:hover': {
                bgcolor: 'action.hover',
              },

              '& .MuiAvatar-root': {
                transition: 'transform .2s ease',
              },

              '&:hover .MuiAvatar-root': {
                transform: 'scale(1.05)',
              },


            }}
            onClick={e => setAnchorEl(e.currentTarget)}
          >
            <Box
              sx={{
                textAlign: 'right',
                display: { xs: 'none', sm: 'block' },
              }}
            >
              <Typography variant="body2" fontWeight={600}>
                {user?.fullName}
              </Typography>

              <Typography
                variant="caption"
                color="text.secondary"
              >
                {user?.role}
              </Typography>
            </Box>

            <Avatar
              src={
                user?.profileImage
                  ? `http://localhost:8080/uploads/profile-images/${user.profileImage}`
                  : undefined
              }
              sx={{
                bgcolor: 'secondary.main',
                width: 42,
                height: 42,
              }}
            >
              {!user?.profileImage &&
                `${user?.firstName?.charAt(0) || ''}${user?.lastName?.charAt(0) || ''}`}
            </Avatar>
          </Box>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
          >
            <MenuItem disabled>
              <Typography variant="body2">
                {user?.email}
              </Typography>
            </MenuItem>

            <Divider />

            <MenuItem
              onClick={() => {
                setAnchorEl(null);
                logout();
                navigate('/login');
              }}
            >
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>

              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{
          width: { md: drawerWidth },
          flexShrink: { md: 0 },
        }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              border: 0,
            },
          }}
        >
          {drawer}
        </Drawer>

        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              border: 0,
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 3 },
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: 8,
          minHeight: '100vh',
          background:
            mode === 'light'
              ? 'radial-gradient(ellipse at top right, rgba(196,92,38,0.08), transparent 45%), radial-gradient(ellipse at bottom left, rgba(11,61,74,0.07), transparent 40%), #F3F0E8'
              : 'radial-gradient(ellipse at top right, rgba(196,92,38,0.15), transparent 45%), radial-gradient(ellipse at bottom left, rgba(11,61,74,0.20), transparent 40%), #121212',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
