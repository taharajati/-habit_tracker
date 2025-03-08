import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth services
export const authService = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (name, email, password) =>
    api.post('/auth/register', { name, email, password }),
  getCurrentUser: () => api.get('/auth/me'),
};

// Habits services
export const habitService = {
  getHabits: () => api.get('/habits'),
  createHabit: (data) => api.post('/habits', data),
  updateHabit: (id, data) => api.put(`/habits/${id}`, data),
  deleteHabit: (id) => api.delete(`/habits/${id}`),
  toggleHabitComplete: (id, completed) =>
    api.patch(`/habits/${id}/complete`, { completed }),
};

// Progress services
export const progressService = {
  getProgress: (timeRange) => api.get(`/progress?timeRange=${timeRange}`),
};

// Mood services
export const moodService = {
  getMoods: (timeRange) => api.get(`/mood?timeRange=${timeRange}`),
  createMood: (data) => api.post('/mood', data),
};

// Challenges services
export const challengeService = {
  getChallenges: () => api.get('/challenges'),
  createChallenge: (data) => api.post('/challenges', data),
  updateChallenge: (id, data) => api.put(`/challenges/${id}`, data),
  deleteChallenge: (id) => api.delete(`/challenges/${id}`),
  joinChallenge: (id) => api.post(`/challenges/${id}/join`),
};

export default api; 