import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8080/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
};

export const employeeApi = {
  search: (params) => api.get('/employees', { params }),
  getById: (id) => api.get(`/employees/${id}`),
  getCurrentUser: () => api.get("/employees/me"),

  uploadMyProfile: (file) => {
    const formData = new FormData();
    formData.append("file", file);

    return api.post("/employees/me/upload-profile", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
  removeMyProfile: () => api.delete("/employees/me/profile"),
  create: (data) => api.post('/employees', data),
  update: (id, data) => api.put(`/employees/${id}`, data),
  uploadProfile: (id, file) => {
    const formData = new FormData();
    formData.append("file", file);

    return api.post(`/employees/${id}/upload-profile`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
  remove: (id) => api.delete(`/employees/${id}`),
};

export const projectApi = {
  search: (params) => api.get('/projects', { params }),
  getById: (id) => api.get(`/projects/${id}`),
  getByEmployee: (employeeId) => api.get(`/projects/employee/${employeeId}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  assign: (id, employeeIds) => api.put(`/projects/${id}/assign`, employeeIds),
  remove: (id) => api.delete(`/projects/${id}`),
};

export const taskApi = {
  search: (params) => api.get('/tasks', { params }),
  getById: (id) => api.get(`/tasks/${id}`),
  getByAssignee: (assigneeId) => api.get(`/tasks/assignee/${assigneeId}`),
  getByProject: (projectId) => api.get(`/tasks/project/${projectId}`),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  updateProgress: (id, data) => api.patch(`/tasks/${id}/progress`, data),
  remove: (id) => api.delete(`/tasks/${id}`),
};

export const dashboardApi = {
  admin: () => api.get('/dashboard/admin'),
  employee: () => api.get('/dashboard/employee'),
};

export const reportApi = {
  employee: (id) => api.get(`/reports/employee/${id}`),
  project: (id) => api.get(`/reports/project/${id}`),
  pending: () => api.get('/reports/pending'),
  exportExcel: (params) =>
    api.get('/reports/export/excel', {
      params,
      responseType: 'blob',
    }),

  exportPdf: (params) =>
    api.get('/reports/export/pdf', {
      params,
      responseType: 'blob',
    }),
};

export default api;
