import axiosInstance from '../api/axiosInstance';

export const statsService = {
  // Statistiques générales
  getOverviewStats: async (params = {}) => {
    const response = await axiosInstance.get('/api/stats/overview/', { params });
    return response.data;
  },

  // Statistiques détaillées
  getMemberStats: async (params = {}) => {
    const response = await axiosInstance.get('/api/stats/members/', { params });
    return response.data;
  },

  getEventStats: async (params = {}) => {
    const response = await axiosInstance.get('/api/stats/events/', { params });
    return response.data;
  },

  getForumStats: async (params = {}) => {
    const response = await axiosInstance.get('/api/stats/forums/', { params });
    return response.data;
  },

  getResourceStats: async (params = {}) => {
    const response = await axiosInstance.get('/api/stats/resources/', { params });
    return response.data;
  },

  // Tendances
  getTrends: async (metric, params = {}) => {
    const response = await axiosInstance.get(`/api/stats/trends/${metric}/`, { params });
    return response.data;
  },

  // Export
  exportReport: async (params = {}) => {
    const response = await axiosInstance.get('/api/stats/export/', {
      params,
      responseType: 'blob'
    });
    return response.data;
  },

  // Comparaisons
  getComparisons: async (params = {}) => {
    const response = await axiosInstance.get('/api/stats/compare/', { params });
    return response.data;
  }
};