import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
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

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken
          });

          const { token, refreshToken: newRefreshToken } = response.data;
          localStorage.setItem('token', token);
          localStorage.setItem('refreshToken', newRefreshToken);

          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  register: async (
    username: string, 
    email: string, 
    password: string, 
    confirmPassword: string, 
    displayName?: string
  ) => {
    const response = await api.post('/auth/register', {
      username,
      email,
      password,
      confirmPassword,
      displayName
    });
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  getCurrentUser: async (token?: string) => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  refreshToken: async (refreshToken: string) => {
    const response = await api.post('/auth/refresh', { refreshToken });
    return response.data;
  }
};

// Tournament API
export const tournamentAPI = {
  createRoom: async (roomData: any) => {
    const response = await api.post('/tournament/rooms', roomData);
    return response.data;
  },

  joinRoom: async (roomId: string) => {
    const response = await api.post(`/tournament/rooms/${roomId}/join`);
    return response.data;
  },

  leaveRoom: async (roomId: string) => {
    const response = await api.post(`/tournament/rooms/${roomId}/leave`);
    return response.data;
  },

  getRoom: async (roomId: string) => {
    const response = await api.get(`/tournament/rooms/${roomId}`);
    return response.data;
  },

  getRooms: async () => {
    const response = await api.get('/tournament/rooms');
    return response.data;
  }
};

// BanPick API
export const banPickAPI = {
  startBanPick: async (roomId: string) => {
    const response = await api.post(`/banpick/${roomId}/start`);
    return response.data;
  },

  banOperator: async (roomId: string, operatorId: string) => {
    const response = await api.post(`/banpick/${roomId}/ban`, { operatorId });
    return response.data;
  },

  pickOperator: async (roomId: string, operatorId: string) => {
    const response = await api.post(`/banpick/${roomId}/pick`, { operatorId });
    return response.data;
  },

  getBanPickState: async (roomId: string) => {
    const response = await api.get(`/banpick/${roomId}/state`);
    return response.data;
  }
};

export default api;