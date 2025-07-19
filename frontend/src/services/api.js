import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Intercepteur pour ajouter le token JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur pour gérer les erreurs de réponse
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/api/auth/refresh/`, {
            refresh: refreshToken
          });
          
          const { access } = response.data;
          localStorage.setItem('access_token', access);
          
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export const authService = {
  login: async (username, password) => {
    try {
      console.log('Tentative de connexion...', { username });
      
      // CORRECTION: Utiliser l'URL correcte de votre backend
      const response = await api.post('/api/auth/login/', { username, password });
      
      console.log('Réponse login:', response.data);
      
      const { access, refresh, user } = response.data;
      
      // Stocker les tokens
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      localStorage.setItem('user', JSON.stringify(user));
      
      return response.data;
    } catch (error) {
      console.error('Erreur login:', error.response || error);
      throw error;
    }
  },

  register: async (formData) => {
    try {
      // CORRECTION: Utiliser l'URL correcte
      const response = await api.post('/api/auth/register/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error) {
      console.error('Erreur inscription:', error.response || error);
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },

  isAuthenticated: () => {
    const token = localStorage.getItem('access_token');
    if (!token) return false;
    
    try {
      const tokenParts = token.split('.');
      const tokenDecoded = JSON.parse(atob(tokenParts[1]));
      const currentTime = Date.now() / 1000;
      
      return tokenDecoded.exp > currentTime;
    } catch {
      return false;
    }
  },

  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
};

export const userService = {
  getProfile: async () => {
    const response = await api.get('/api/profile/');
    return response.data;
  },

  updateProfile: async (data) => {
    const response = await api.patch('/api/profile/', data);
    return response.data;
  },

  getParticipants: async (params = {}) => {
    const response = await api.get('/api/participants/', { params });
    return response.data;
  }
};

export default api;