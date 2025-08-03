import api from './api';

export const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { token, user } = response.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    return { token, user };
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  createUser: async (userData) => {
    const response = await api.post('/auth/users', userData);
    return response.data;
  },

  getAllUsers: async () => {
    const response = await api.get('/auth/users');
    return response.data;
  }
};