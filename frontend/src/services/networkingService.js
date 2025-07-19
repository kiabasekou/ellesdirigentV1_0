import axiosInstance from '../api/axiosInstance';

export const networkingService = {
  // Membres
  getMembers: async (params = {}) => {
    const response = await axiosInstance.get('/api/networking/members/', { params });
    return response.data;
  },

  getMember: async (memberId) => {
    const response = await axiosInstance.get(`/api/networking/members/${memberId}/`);
    return response.data;
  },

  // Connexions
  getConnections: async () => {
    const response = await axiosInstance.get('/api/networking/connections/');
    return response.data;
  },

  sendConnectionRequest: async (memberId, data = {}) => {
    const response = await axiosInstance.post(`/api/networking/members/${memberId}/connect/`, data);
    return response.data;
  },

  // Demandes de connexion
  getConnectionRequests: async () => {
    const response = await axiosInstance.get('/api/networking/requests/');
    return response.data;
  },

  acceptRequest: async (requestId) => {
    const response = await axiosInstance.post(`/api/networking/requests/${requestId}/accept/`);
    return response.data;
  },

  rejectRequest: async (requestId) => {
    const response = await axiosInstance.post(`/api/networking/requests/${requestId}/reject/`);
    return response.data;
  },

  // Messages
  sendMessage: async (memberId, data) => {
    const response = await axiosInstance.post(`/api/networking/members/${memberId}/message/`, data);
    return response.data;
  },

  // Recherche
  searchMembers: async (query) => {
    const response = await axiosInstance.get('/api/networking/search/', { params: { q: query } });
    return response.data;
  },

  // Recommandations
  getRecommendations: async () => {
    const response = await axiosInstance.get('/api/networking/recommendations/');
    return response.data;
  }
};