import React, { useEffect, useState } from 'react';
import {
  Box,
  Chip,
  CircularProgress,
  Grid,
  LinearProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  useTheme
} from '@mui/material';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import FolderOpenOutlinedIcon from '@mui/icons-material/FolderOpenOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { dashboardApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useNotify } from '../context/NotificationContext';
import StatusChip from '../components/common/StatusChip';

function StatCard({ title, value, icon, accent }) {
  const theme = useTheme();
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        height: '100%',
        border: '1px solid rgba(11,61,74,0.1)',
        background: `linear-gradient(135deg, #FFFCF7 0%, ${accent} 100%)`,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography
            variant="body2"
            sx={{
              color:
                theme.palette.mode === 'dark'
                  ? '#374151'
                  : 'text.secondary',
              fontWeight: 600,
            }}
          >{title}</Typography>
          <Typography
            variant="h3"
            sx={{
              mt: 1,
              fontWeight: 300,
              color:
                theme.palette.mode === 'dark'
                  ? '#F8FAFC'
                  : '#1F2937',
            }}
          >
            {value ?? 0}
</Typography>
        </Box>
        <Box sx={{ color: 'primary.main', opacity: 0.7 }}>{icon}</Box>
      </Box>
    </Paper>
  );
}

export default function DashboardPage() {
  const { isAdmin, user } = useAuth();
  const { notify } = useNotify();
  const theme = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = isAdmin
          ? await dashboardApi.admin()
          : await dashboardApi.employee();
        setData(res.data.data);
      } catch (err) {
        notify(err.response?.data?.message || 'Failed to load dashboard', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isAdmin, notify]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  const priorityData = data?.tasksByPriority
    ? Object.entries(data.tasksByPriority).map(([name, value]) => ({ name, value }))
    : [];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {isAdmin ? 'Admin Dashboard' : `Hello, ${user?.firstName}`}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        {isAdmin
          ? 'Overview of employees, projects, and task delivery.'
          : 'Your assigned work, progress, and upcoming deadlines.'}
      </Typography>

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {isAdmin && (
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title="Employees" value={data?.totalEmployees} icon={<PeopleAltOutlinedIcon fontSize="large" />} accent="rgba(11,61,74,0.06)" />
          </Grid>
        )}
        {isAdmin && (
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title="Projects" value={data?.totalProjects} icon={<FolderOpenOutlinedIcon fontSize="large" />} accent="rgba(196,92,38,0.08)" />
          </Grid>
        )}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total Tasks" value={data?.totalTasks} icon={<AssignmentOutlinedIcon fontSize="large" />} accent="rgba(29,78,137,0.08)" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Completed" value={data?.completedTasks} icon={<CheckCircleOutlineIcon fontSize="large" />} accent="rgba(45,106,79,0.08)" />
        </Grid>
      </Grid>

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={5}>
          <Paper elevation={0} sx={{ p: 2.5, border: '1px solid rgba(11,61,74,0.1)', height: '100%' }}>
            <Typography variant="h6" gutterBottom>Tasks by Priority</Typography>
            <Box sx={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priorityData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={
                      theme.palette.mode === 'dark'
                        ? 'rgba(203,213,225,0.18)'
                        : 'rgba(100,116,139,0.15)'
                    }
                  />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: theme.palette.mode === 'dark' ? '#CBD5E1' : '#334155',}}  />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: theme.palette.mode === 'dark' ? '#CBD5E1' : '#334155', }}  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor:
                        theme.palette.mode === 'dark'
                          ? '#1F2937'
                          : '#FFFFFF',

                      border: '1px solid',

                      borderColor:
                        theme.palette.mode === 'dark'
                          ? '#374151'
                          : '#D1D5DB',

                      borderRadius: 10,
                    }}

                    labelStyle={{
                      color:
                        theme.palette.mode === 'dark'
                          ? '#F8FAFC'
                          : '#1F2937',
                      fontWeight: 400,
                    }}

                    itemStyle={{
                      color:
                        theme.palette.mode === 'dark'
                          ? '#F8FAFC'
                          : '#1F2937',
                    }}
                  />
                  <Bar dataKey="value" fill="#1c3f4d" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={7}>
          <Paper elevation={0} sx={{ p: 2.5, border: '1px solid rgba(11,61,74,0.1)', height: '100%' }}>
            <Typography variant="h6" gutterBottom>Upcoming Deadlines</Typography>
            {(data?.upcomingDeadlines || []).length === 0 ? (
              <Typography color="text.secondary">No upcoming deadlines.</Typography>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Task</TableCell>
                    <TableCell>Project</TableCell>
                    <TableCell>Due</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Progress</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.upcomingDeadlines.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell>{task.title}</TableCell>
                      <TableCell>{task.projectName}</TableCell>
                      <TableCell>{task.dueDate || '-'}</TableCell>
                      <TableCell><StatusChip value={task.status} /></TableCell>
                      <TableCell sx={{ minWidth: 100 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LinearProgress variant="determinate" value={task.progress || 0} sx={{ flex: 1, height: 6, borderRadius: 3 }} />
                          <Typography variant="caption">{task.progress || 0}%</Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Paper>
        </Grid>

        {isAdmin && (
          <Grid item xs={12}>
            <Paper elevation={0} sx={{ p: 2.5, border: '1px solid rgba(11,61,74,0.1)' }}>
              <Typography variant="h6" gutterBottom>Projects by Status</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                {Object.entries(data?.projectsByStatus || {}).map(([status, count]) => (
                  <Chip
                    key={status}
                    label={`${status.replace('_', ' ')}: ${count}`}
                    sx={{ bgcolor: 'rgba(11,61,74,0.08)', fontWeight: 600 }}
                  />
                ))}
              </Box>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
} 