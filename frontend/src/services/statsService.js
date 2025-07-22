// ============================================================================
// frontend/src/services/statsService.js - CORRECTION
// ============================================================================

// CORRECTION: Importe l'instance 'api' par défaut depuis api.js
import api from '../api'; // Assurez-vous que le chemin est correct

export const statsService = {
  // Statistiques générales
  getOverviewStats: async (params = {}) => {
    // CORRECTION: Utilise api.get et supprime le préfixe /api/
    const response = await api.get('/stats/overview/', { params });
    return response.data;
  },

  // Statistiques détaillées
  getMemberStats: async (params = {}) => {
    // CORRECTION: Utilise api.get et supprime le préfixe /api/
    const response = await api.get('/stats/members/', { params });
    return response.data;
  },

  getEventStats: async (params = {}) => {
    // CORRECTION: Utilise api.get et supprime le préfixe /api/
    const response = await api.get('/stats/events/', { params });
    return response.data;
  },

  getForumStats: async (params = {}) => {
    // CORRECTION: Utilise api.get et supprime le préfixe /api/
    const response = await api.get('/stats/forums/', { params });
    return response.data;
  },

  getResourceStats: async (params = {}) => {
    // CORRECTION: Utilise api.get et supprime le préfixe /api/
    const response = await api.get('/stats/resources/', { params });
    return response.data;
  },

  // Tendances
  getTrends: async (metric, params = {}) => {
    // CORRECTION: Utilise api.get et supprime le préfixe /api/
    const response = await api.get(`/stats/trends/${metric}/`, { params });
    return response.data;
  },

  // Export
  exportReport: async (params = {}) => {
    // CORRECTION: Utilise api.get et supprime le préfixe /api/
    const response = await api.get('/stats/export/', {
      params,
      responseType: 'blob'
    });
    return response.data;
  },

  // Comparaisons
  getComparisons: async (params = {}) => {
    // CORRECTION: Utilise api.get et supprime le préfixe /api/
    const response = await api.get('/stats/compare/', { params });
    return response.data;
  }
};
