// ============================================================================
// frontend/src/services/networkingService.js - CORRECTION
// ============================================================================

// CORRECTION: Importe l'instance 'api' par défaut depuis api.js
import api from '../api'; // Assurez-vous que le chemin est correct

export const networkingService = {
  // Membres
  getMembers: async (params = {}) => {
    // CORRECTION: Utilise api.get et supprime le préfixe /api/
    const response = await api.get('/networking/members/', { params });
    return response.data;
  },

  getMember: async (memberId) => {
    // CORRECTION: Utilise api.get et supprime le préfixe /api/
    const response = await api.get(`/networking/members/${memberId}/`);
    return response.data;
  },

  // Connexions
  getConnections: async () => {
    // CORRECTION: Utilise api.get et supprime le préfixe /api/
    const response = await api.get('/networking/connections/');
    return response.data;
  },

  sendConnectionRequest: async (memberId, data = {}) => {
    // CORRECTION: Utilise api.post et supprime le préfixe /api/
    const response = await api.post(`/networking/members/${memberId}/connect/`, data);
    return response.data;
  },

  // Demandes de connexion
  getConnectionRequests: async () => {
    // CORRECTION: Utilise api.get et supprime le préfixe /api/
    const response = await api.get('/networking/requests/');
    return response.data;
  },

  acceptRequest: async (requestId) => {
    // CORRECTION: Utilise api.post et supprime le préfixe /api/
    const response = await api.post(`/networking/requests/${requestId}/accept/`);
    return response.data;
  },

  rejectRequest: async (requestId) => {
    // CORRECTION: Utilise api.post et supprime le préfixe /api/
    const response = await api.post(`/networking/requests/${requestId}/reject/`);
    return response.data;
  },

  // Messages
  sendMessage: async (memberId, data) => {
    // CORRECTION: Utilise api.post et supprime le préfixe /api/
    const response = await api.post(`/networking/members/${memberId}/message/`, data);
    return response.data;
  },

  // Recherche
  searchMembers: async (query) => {
    // CORRECTION: Utilise api.get et supprime le préfixe /api/
    const response = await api.get('/networking/search/', { params: { q: query } });
    return response.data;
  },

  // Recommandations
  getRecommendations: async () => {
    // CORRECTION: Utilise api.get et supprime le préfixe /api/
    const response = await api.get('/networking/recommendations/');
    return response.data;
  }
};
