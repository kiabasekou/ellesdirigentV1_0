import axiosInstance, { uploadWithProgress } from '../api/axiosInstance';

export const profileService = {
  // Récupérer le profil de l'utilisateur
  getProfile: async () => {
    const response = await axiosInstance.get('/api/users/me/');
    return response.data;
  },

  // Mettre à jour le profil
  updateProfile: async (data) => {
    const response = await axiosInstance.patch('/api/users/me/', data);
    return response.data;
  },

  // Upload avatar avec progress
  uploadAvatar: async (formData, onUploadProgress) => {
    const response = await uploadWithProgress('/api/users/avatar/', formData, onUploadProgress);
    return response.data;
  },

  // Récupérer les statistiques du profil
  getProfileStats: async () => {
    const response = await axiosInstance.get('/api/users/me/stats/');
    return response.data;
  },

  // Récupérer les badges
  getBadges: async () => {
    const response = await axiosInstance.get('/api/users/me/badges/');
    return response.data;
  }
};