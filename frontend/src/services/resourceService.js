import axiosInstance, { uploadWithProgress } from '../api/axiosInstance'; // Utiliser la fonction helper

export const resourceService = {
  // Récupérer les ressources
  getResources: async (params = {}) => {
    const response = await axiosInstance.get('/api/resources/', { params });
    return response.data;
  },

  // Détail d'une ressource
  getResource: async (resourceId) => {
    const response = await axiosInstance.get(`/api/resources/${resourceId}/`);
    return response.data;
  },

  // Upload une ressource avec progress
  uploadResource: async (formData, onUploadProgress) => {
    const response = await uploadWithProgress('/api/resources/', formData, onUploadProgress);
    return response.data;
  },

  // Télécharger une ressource
  downloadResource: async (resourceId) => {
    const response = await axiosInstance.get(`/api/resources/${resourceId}/download/`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Actions sur les ressources
  likeResource: async (resourceId) => {
    const response = await axiosInstance.post(`/api/resources/${resourceId}/like/`);
    return response.data;
  },

  saveResource: async (resourceId) => {
    const response = await axiosInstance.post(`/api/resources/${resourceId}/save/`);
    return response.data;
  },

  // Catégories
  getCategories: async () => {
    const response = await axiosInstance.get('/api/resources/categories/');
    return response.data;
  },

  // Recherche
  searchResources: async (query) => {
    const response = await axiosInstance.get('/api/resources/search/', { params: { q: query } });
    return response.data;
  }
};