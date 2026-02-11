import axios from './axios';

export const authAPI = {
  login: async (credentials) => {
    const response = await axios.post('/auth/login', credentials);
    return response.data;
  },

  register: async (userData) => {
    const response = await axios.post('/auth/register', userData);
    return response.data;
  },

  refresh: async (refreshToken) => {
    const response = await axios.post('/auth/refresh', { refresh_token: refreshToken });
    return response.data;
  },

  logout: async () => {
    const response = await axios.post('/auth/logout');
    return response.data;
  },

  me: async () => {
    const response = await axios.get('/auth/me');
    return response.data;
  },
};
