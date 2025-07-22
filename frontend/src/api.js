// ============================================================================
// frontend/src/api.js - CORRECTION POUR LE DOUBLE /API/
// ============================================================================

import axios from 'axios';

// Configuration de base d'Axios
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  // CORRECTION: La baseURL ne doit PAS inclure /api ici.
  // Elle doit être l'URL racine de votre backend.
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token JWT automatiquement
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les réponses et les erreurs
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Gestion de l'expiration du token (401)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          // CORRECTION: Assurez-vous que le chemin ici inclut /api/
          const response = await axios.post(`${API_BASE_URL}/api/auth/refresh/`, {
            refresh: refreshToken,
          });

          const { access } = response.data;
          localStorage.setItem('accessToken', access);

          // Réessayer la requête originale avec le nouveau token
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Échec du refresh, rediriger vers login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// ============================================================================
// FONCTIONS D'API CORRIGÉES - AJOUT DE /API/ À TOUS LES ENDPOINTS
// ============================================================================

// Authentification
export const authAPI = {
  login: (credentials) => {
    console.log('Tentative de connexion...', credentials);
    // CORRECTION: Ajout de '/api/' au début du chemin
    return api.post('/api/auth/login/', credentials);
  },

  register: (userData) => {
    // CORRECTION: Ajout de '/api/' au début du chemin
    return api.post('/api/auth/register/', userData);
  },

  logout: (refreshToken) => {
    // CORRECTION: Ajout de '/api/' au début du chemin
    return api.post('/api/auth/logout/', { refresh: refreshToken });
  },

  refreshToken: (refreshToken) => {
    // CORRECTION: Ajout de '/api/' au début du chemin
    return api.post('/api/auth/refresh/', { refresh: refreshToken });
  },

  getProfile: () => {
    // CORRECTION: Ajout de '/api/' au début du chemin
    return api.get('/api/auth/profile/');
  },

  updateProfile: (profileData) => {
    // CORRECTION: Ajout de '/api/' au début du chemin
    return api.patch('/api/auth/profile/update/', profileData);
  },

  changePassword: (passwordData) => {
    // CORRECTION: Ajout de '/api/' au début du chemin
    return api.post('/api/auth/change-password/', passwordData);
  },
};

// Formations
export const trainingAPI = {
  getFormations: (params = {}) => {
    // CORRECTION: Ajout de '/api/' au début du chemin
    return api.get('/api/training/formations/', { params });
  },

  getFormation: (id) => {
    // CORRECTION: Ajout de '/api/' au début du chemin
    return api.get(`/api/training/formations/${id}/`);
  },

  createFormation: (formationData) => {
    // CORRECTION: Ajout de '/api/' au début du chemin
    return api.post('/api/training/formations/', formationData);
  },

  updateFormation: (id, formationData) => {
    // CORRECTION: Ajout de '/api/' au début du chemin
    return api.put(`/api/training/formations/${id}/`, formationData);
  },

  deleteFormation: (id) => {
    // CORRECTION: Ajout de '/api/' au début du chemin
    return api.delete(`/api/training/formations/${id}/`);
  },

  // Inscriptions
  getInscriptions: () => {
    // CORRECTION: Ajout de '/api/' au début du chemin
    return api.get('/api/training/inscriptions/');
  },

  createInscription: (formationId) => {
    // CORRECTION: Ajout de '/api/' au début du chemin
    return api.post('/api/training/inscriptions/', { formation: formationId });
  },

  // Actions sur formations
  inscrireFormation: (formationId) => {
    // CORRECTION: Ajout de '/api/' au début du chemin
    return api.post(`/api/training/formations/${formationId}/inscrire/`);
  },

  marquerComplete: (inscriptionId) => {
    // CORRECTION: Ajout de '/api/' au début du chemin
    return api.post(`/api/training/inscriptions/${inscriptionId}/marquer_complete/`);
  },

  evaluerFormation: (inscriptionId, evaluation) => {
    // CORRECTION: Ajout de '/api/' au début du chemin
    return api.post(`/api/training/inscriptions/${inscriptionId}/evaluer/`, evaluation);
  },

  getCertificats: () => {
    // CORRECTION: Ajout de '/api/' au début du chemin
    return api.get('/api/training/certificates/');
  },
};

// Quiz
export const quizAPI = {
  getQuiz: (params = {}) => {
    // CORRECTION: Ajout de '/api/' au début du chemin
    return api.get('/api/quiz/quiz/', { params });
  },

  getQuizDetail: (id) => {
    // CORRECTION: Ajout de '/api/' au début du chemin
    return api.get(`/api/quiz/quiz/${id}/`);
  },

  commencerQuiz: (quizId) => {
    // CORRECTION: Ajout de '/api/' au début du chemin
    return api.post(`/api/quiz/quiz/${quizId}/commencer/`);
  },

  soumettreQuiz: (quizId, reponses) => {
    // CORRECTION: Ajout de '/api/' au début du chemin
    return api.post(`/api/quiz/quiz/${quizId}/soumettre/`, { reponses });
  },

  getTentatives: () => {
    // CORRECTION: Ajout de '/api/' au début du chemin
    return api.get('/api/quiz/tentatives/');
  },

  getResultatsQuiz: (quizId) => {
    // CORRECTION: Ajout de '/api/' au début du chemin
    return api.get(`/api/quiz/quiz/${quizId}/resultats/`);
  },
};

// Événements
export const eventsAPI = {
  getEvents: (params = {}) => {
    // CORRECTION: Ajout de '/api/' au début du chemin
    return api.get('/api/events/events/', { params });
  },

  getEvent: (id) => {
    // CORRECTION: Ajout de '/api/' au début du chemin
    return api.get(`/api/events/events/${id}/`);
  },

  createEvent: (eventData) => {
    // CORRECTION: Ajout de '/api/' au début du chemin
    return api.post('/api/events/events/', eventData);
  },

  updateEvent: (id, eventData) => {
    // CORRECTION: Ajout de '/api/' au début du chemin
    return api.put(`/api/events/events/${id}/`, eventData);
  },

  deleteEvent: (id) => {
    // CORRECTION: Ajout de '/api/' au début du chemin
    return api.delete(`/api/events/events/${id}/`);
  },

  // Inscriptions aux événements
  inscrireEvent: (eventId) => {
    // CORRECTION: Ajout de '/api/' au début du chemin
    return api.post(`/api/events/events/${eventId}/inscrire/`);
  },

  desinscrireEvent: (eventId) => {
    // CORRECTION: Ajout de '/api/' au début du chemin
    return api.delete(`/api/events/events/${eventId}/desinscrire/`);
  },

  // Données spécialisées
  getDashboard: () => {
    // CORRECTION: Ajout de '/api/' au début du chemin
    return api.get('/api/events/dashboard/');
  },

  searchEvents: (params) => {
    // CORRECTION: Ajout de '/api/' au début du chemin
    return api.get('/api/events/search/', { params });
  },

  getRecommendations: () => {
    // CORRECTION: Ajout de '/api/' au début du chemin
    return api.get('/api/events/recommendations/');
  },

  getAnalytics: (eventId) => {
    // CORRECTION: Ajout de '/api/' au début du chemin
    return api.get(`/api/events/analytics/${eventId}/`);
  },

  getCalendar: (params = {}) => {
    // CORRECTION: Ajout de '/api/' au début du chemin
    return api.get('/api/events/calendar/', { params });
  },
};

// API générale
export const generalAPI = {
  getHealth: () => {
    // CORRECTION: Ajout de '/api/' au début du chemin
    return api.get('/api/health/');
  },

  getStats: () => {
    // CORRECTION: Ajout de '/api/' au début du chemin
    return api.get('/api/stats/');
  },

  getApiInfo: () => {
    // CORRECTION: Ajout de '/api/' au début du chemin
    return api.get('/api/');
  },
};

// Export par défaut
export default api;

// ============================================================================
// UTILITAIRES
// ============================================================================

export const handleApiError = (error) => {
  if (error.response) {
    // Erreur de réponse du serveur
    const { status, data } = error.response;

    switch (status) {
      case 400:
        return `Erreur de validation: ${data.detail || 'Données invalides'}`;
      case 401:
        return 'Session expirée, veuillez vous reconnecter';
      case 403:
        return 'Accès non autorisé';
      case 404:
        return 'Ressource non trouvée';
      case 500:
        return 'Erreur serveur, veuillez réessayer plus tard';
      default:
        return `Erreur ${status}: ${data.detail || 'Erreur inconnue'}`;
    }
  } else if (error.request) {
    // Erreur de réseau
    return 'Erreur de connexion, vérifiez votre réseau';
  } else {
    // Autre erreur
    return `Erreur: ${error.message}`;
  }
};

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('accessToken', token);
  } else {
    delete api.defaults.headers.common['Authorization'];
    localStorage.removeItem('accessToken');
  }
};

export const clearAuth = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  delete api.defaults.headers.common['Authorization'];
};

export const adminAPI = {
  getStats: () => {
    // CORRECTION: Ajout de '/api/' au début du chemin
    return api.get('/api/admin/stats/');
  },

  getPendingUsers: (limit = 5) => {
    // CORRECTION: Ajout de '/api/' au début du chemin
    return api.get(`/api/admin/pending-users/?limit=${limit}`);
  },

  getRecentActivities: (limit = 10) => {
    // CORRECTION: Ajout de '/api/' au début du chemin
    return api.get(`/api/admin/recent-activities/?limit=${limit}`);
  },

  getAllUsers: (params = {}) => {
    // CORRECTION: Ajout de '/api/' au début du chemin
    return api.get('/api/admin/users/', { params });
  },

  activateUser: (userId) => {
    // CORRECTION: Ajout de '/api/' au début du chemin
    return api.post(`/api/admin/users/${userId}/activate/`);
  },

  deactivateUser: (userId, reason) => {
    // CORRECTION: Ajout de '/api/' au début du chemin
    return api.post(`/api/admin/users/${userId}/deactivate/`, { motif_rejet: reason });
  },
};
