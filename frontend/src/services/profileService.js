// ============================================================================
// frontend/src/services/profileService.js - CORRECTION
// ============================================================================

// CORRECTION: Importe l'instance 'api' par défaut et l'objet 'authAPI'
import api, { authAPI } from '../api'; // Assurez-vous que le chemin est correct

// Implémentation simple de uploadWithProgress si elle n'est pas dans api.js
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


export const profileService = {
  // Récupérer le profil de l'utilisateur
  getProfile: async () => {
    // CORRECTION: Utilise authAPI.getProfile
    const response = await authAPI.getProfile();
    return response.data;
  },

  // Mettre à jour le profil
  updateProfile: async (data) => {
    // CORRECTION: Utilise authAPI.updateProfile
    const response = await authAPI.updateProfile(data);
    return response.data;
  },

  // Upload avatar avec progress
  uploadAvatar: async (formData, onUploadProgress) => {
    // CORRECTION: Utilise l'implémentation locale de uploadWithProgress qui utilise 'api'
    // et supprime le préfixe /api/
    const response = await uploadWithProgress('/users/avatar/', formData, onUploadProgress);
    return response.data;
  },

  // Récupérer les statistiques du profil
  getProfileStats: async () => {
    // Cette fonction n'a pas d'équivalent direct dans authAPI ou generalAPI pour un profil spécifique.
    // Nous utilisons l'instance 'api' par défaut avec l'endpoint complet.
    // CORRECTION: Utilise api.get et supprime le préfixe /api/
    const response = await api.get('/users/me/stats/');
    return response.data;
  },

  // Récupérer les badges
  getBadges: async () => {
    // Cette fonction n'a pas d'équivalent direct dans api.js.
    // Nous utilisons l'instance 'api' par défaut avec l'endpoint complet.
    // CORRECTION: Utilise api.get et supprime le préfixe /api/
    const response = await api.get('/users/me/badges/');
    return response.data;
  }
};
