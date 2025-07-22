// ============================================================================
// frontend/src/services/resourceService.js - CORRECTION
// ============================================================================

// CORRECTION: Importe l'instance 'api' par défaut depuis api.js
import api from '../api'; // Assurez-vous que le chemin est correct

// Implémentation simple de uploadWithProgress, similaire à celle utilisée dans profileService.js
// Cette fonction utilise l'instance 'api' importée ci-dessus.
const uploadWithProgress = (url, formData, onUploadProgress) => {
  return api.post(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data', // Important pour l'upload de fichiers
    },
    onUploadProgress: (progressEvent) => {
      const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
      if (onUploadProgress) {
        onUploadProgress(percentCompleted);
      }
    },
  });
};

export const resourceService = {
  // Récupérer les ressources
  getResources: async (params = {}) => {
    // CORRECTION: Utilise api.get et supprime le préfixe /api/
    const response = await api.get('/resources/', { params });
    return response.data;
  },

  // Détail d'une ressource
  getResource: async (resourceId) => {
    // CORRECTION: Utilise api.get et supprime le préfixe /api/
    const response = await api.get(`/resources/${resourceId}/`);
    return response.data;
  },

  // Upload une ressource avec progress
  uploadResource: async (formData, onUploadProgress) => {
    // CORRECTION: Utilise l'implémentation locale de uploadWithProgress qui utilise 'api'
    // et supprime le préfixe /api/
    const response = await uploadWithProgress('/resources/', formData, onUploadProgress);
    return response.data;
  },

  // Télécharger une ressource
  downloadResource: async (resourceId) => {
    // CORRECTION: Utilise api.get et supprime le préfixe /api/
    const response = await api.get(`/resources/${resourceId}/download/`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Actions sur les ressources
  likeResource: async (resourceId) => {
    // CORRECTION: Utilise api.post et supprime le préfixe /api/
    const response = await api.post(`/resources/${resourceId}/like/`);
    return response.data;
  },

  saveResource: async (resourceId) => {
    // CORRECTION: Utilise api.post et supprime le préfixe /api/
    const response = await api.post(`/resources/${resourceId}/save/`);
    return response.data;
  },

  // Catégories
  getCategories: async () => {
    // CORRECTION: Utilise api.get et supprime le préfixe /api/
    const response = await api.get('/resources/categories/');
    return response.data;
  },

  // Recherche
  searchResources: async (query) => {
    // CORRECTION: Utilise api.get et supprime le préfixe /api/
    const response = await api.get('/resources/search/', { params: { q: query } });
    return response.data;
  }
};
