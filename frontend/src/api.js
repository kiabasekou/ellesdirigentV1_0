// ============================================================================
// frontend/src/api.js - CORRECTION CONFIGURATION API
// ============================================================================

import axios from 'axios';

// Configuration de base d'Axios
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`, // Base URL avec /api
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
// FONCTIONS D'API CORRIGÉES
// ============================================================================

// Authentification
export const authAPI = {
  // CORRECTION: Enlever le préfixe /api/ redondant
  login: (credentials) => {
    console.log('Tentative de connexion...', credentials);
    return api.post('/auth/login/', credentials); // Était: '/api/auth/login/'
  },

  register: (userData) => {
    return api.post('/auth/register/', userData);
  },

  logout: (refreshToken) => {
    return api.post('/auth/logout/', { refresh: refreshToken });
  },

  refreshToken: (refreshToken) => {
    return api.post('/auth/refresh/', { refresh: refreshToken });
  },

  getProfile: () => {
    return api.get('/auth/profile/');
  },

  updateProfile: (profileData) => {
    return api.patch('/auth/profile/update/', profileData);
  },

  changePassword: (passwordData) => {
    return api.post('/auth/change-password/', passwordData);
  },
};

// Formations
export const trainingAPI = {
  getFormations: (params = {}) => {
    return api.get('/training/formations/', { params });
  },

  getFormation: (id) => {
    return api.get(`/training/formations/${id}/`);
  },

  createFormation: (formationData) => {
    return api.post('/training/formations/', formationData);
  },

  updateFormation: (id, formationData) => {
    return api.put(`/training/formations/${id}/`, formationData);
  },

  deleteFormation: (id) => {
    return api.delete(`/training/formations/${id}/`);
  },

  // Inscriptions
  getInscriptions: () => {
    return api.get('/training/inscriptions/');
  },

  createInscription: (formationId) => {
    return api.post('/training/inscriptions/', { formation: formationId });
  },

  // Actions sur formations
  inscrireFormation: (formationId) => {
    return api.post(`/training/formations/${formationId}/inscrire/`);
  },

  marquerComplete: (inscriptionId) => {
    return api.post(`/training/inscriptions/${inscriptionId}/marquer_complete/`);
  },

  evaluerFormation: (inscriptionId, evaluation) => {
    return api.post(`/training/inscriptions/${inscriptionId}/evaluer/`, evaluation);
  },
};

// Quiz
export const quizAPI = {
  getQuiz: (params = {}) => {
    return api.get('/quiz/quiz/', { params });
  },

  getQuizDetail: (id) => {
    return api.get(`/quiz/quiz/${id}/`);
  },

  commencerQuiz: (quizId) => {
    return api.post(`/quiz/quiz/${quizId}/commencer/`);
  },

  soumettreQuiz: (quizId, reponses) => {
    return api.post(`/quiz/quiz/${quizId}/soumettre/`, { reponses });
  },

  getTentatives: () => {
    return api.get('/quiz/tentatives/');
  },

  getResultatsQuiz: (quizId) => {
    return api.get(`/quiz/quiz/${quizId}/resultats/`);
  },
};

// Événements
export const eventsAPI = {
  getEvents: (params = {}) => {
    return api.get('/events/events/', { params });
  },

  getEvent: (id) => {
    return api.get(`/events/events/${id}/`);
  },

  createEvent: (eventData) => {
    return api.post('/events/events/', eventData);
  },

  updateEvent: (id, eventData) => {
    return api.put(`/events/events/${id}/`, eventData);
  },

  deleteEvent: (id) => {
    return api.delete(`/events/events/${id}/`);
  },

  // Inscriptions aux événements
  inscrireEvent: (eventId) => {
    return api.post(`/events/events/${eventId}/inscrire/`);
  },

  desinscrireEvent: (eventId) => {
    return api.delete(`/events/events/${eventId}/desinscrire/`);
  },

  // Données spécialisées
  getDashboard: () => {
    return api.get('/events/dashboard/');
  },

  searchEvents: (params) => {
    return api.get('/events/search/', { params });
  },

  getRecommendations: () => {
    return api.get('/events/recommendations/');
  },

  getAnalytics: (eventId) => {
    return api.get(`/events/analytics/${eventId}/`);
  },

  getCalendar: (params = {}) => {
    return api.get('/events/calendar/', { params });
  },
};

// API générale
export const generalAPI = {
  getHealth: () => {
    return api.get('/health/');
  },

  getStats: () => {
    return api.get('/stats/');
  },

  getApiInfo: () => {
    return api.get('/');
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