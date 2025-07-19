/**
 * API pour l'authentification
 * Gère login, register, refresh token
 */
import axios from './axiosInstance';

export const login = (username, password) =>
  axios.post('/api/token/', { username, password });

export const register = (userData) =>
  axios.post('/api/register/', userData);

export const refreshToken = (refresh) =>
  axios.post('/api/token/refresh/', { refresh });

export const updateProfile = (profileData) =>
  axios.patch('/api/users/me/', profileData);

// Export par défaut pour compatibilité avec authSlice
const authAPI = {
  login,
  register,
  refreshToken,
  updateProfile
};

export default authAPI;