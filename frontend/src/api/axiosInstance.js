/**
 * Configuration Axios avec intercepteurs pour:
 * - Gestion automatique des tokens
 * - Retry automatique en cas d'erreur
 * - Gestion centralisée des erreurs
 * - Cache des requêtes GET
 */
import axios from 'axios';
import { store } from '../redux/store';
import { logout, refreshToken } from '../redux/authSlice'; // Changé refreshTokenSuccess en refreshToken

// Configuration de base
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
const TIMEOUT = 30000; // 30 secondes

// Créer l'instance Axios
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Map pour le cache des requêtes GET
const requestCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Helper pour la gestion du cache
const getCacheKey = (config) => {
  return `${config.method}:${config.url}:${JSON.stringify(config.params || {})}`;
};

// Intercepteur de requête
axiosInstance.interceptors.request.use(
  (config) => {
    // Ajouter le token d'authentification
    const state = store.getState();
    const token = state.auth.token; // Changé de accessToken à token
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Gestion du cache pour les requêtes GET
    if (config.method === 'get' && config.cache !== false) {
      const cacheKey = getCacheKey(config);
      const cachedResponse = requestCache.get(cacheKey);
      
      if (cachedResponse && Date.now() - cachedResponse.timestamp < CACHE_DURATION) {
        // Retourner la réponse cachée
        config.adapter = () => Promise.resolve({
          data: cachedResponse.data,
          status: 200,
          statusText: 'OK (from cache)',
          headers: {},
          config,
        });
      }
    }
    
    // Ajouter un timestamp pour le suivi
    config.metadata = { startTime: new Date() };
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Compteur de retry pour éviter les boucles infinies
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Intercepteur de réponse
axiosInstance.interceptors.response.use(
  (response) => {
    // Logger le temps de réponse en développement
    if (process.env.NODE_ENV === 'development' && response.config.metadata) {
      const endTime = new Date();
      const duration = endTime - response.config.metadata.startTime;
      console.log(`API ${response.config.method.toUpperCase()} ${response.config.url}: ${duration}ms`);
    }
    
    // Mettre en cache les réponses GET
    if (response.config.method === 'get' && response.config.cache !== false) {
      const cacheKey = getCacheKey(response.config);
      requestCache.set(cacheKey, {
        data: response.data,
        timestamp: Date.now(),
      });
      
      // Nettoyer le cache périodiquement
      if (requestCache.size > 100) {
        const now = Date.now();
        for (const [key, value] of requestCache.entries()) {
          if (now - value.timestamp > CACHE_DURATION) {
            requestCache.delete(key);
          }
        }
      }
    }
    
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Gérer les erreurs réseau
    if (!error.response) {
      console.error('Erreur réseau:', error.message);
      return Promise.reject({
        message: 'Erreur de connexion. Vérifiez votre connexion internet.',
        code: 'NETWORK_ERROR',
      });
    }
    
    // Gérer l'expiration du token (401)
    if (error.response.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Si un refresh est déjà en cours, mettre la requête en attente
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }
      
      originalRequest._retry = true;
      isRefreshing = true;
      
      const state = store.getState();
      const refreshTokenValue = state.auth.refreshToken;
      
      if (!refreshTokenValue) {
        store.dispatch(logout());
        window.location.href = '/login';
        return Promise.reject(error);
      }
      
      try {
        const response = await axios.post(`${API_BASE_URL}/api/token/refresh/`, {
          refresh: refreshTokenValue,
        });
        
        const { access } = response.data;
        store.dispatch(refreshToken({ access })); // Utilise refreshToken au lieu de refreshTokenSuccess
        
        processQueue(null, access);
        originalRequest.headers.Authorization = `Bearer ${access}`;
        
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        store.dispatch(logout());
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    // Gérer les erreurs de validation (400)
    if (error.response.status === 400) {
      const errorData = error.response.data;
      return Promise.reject({
        message: errorData.message || 'Données invalides',
        details: errorData.details || errorData,
        code: 'VALIDATION_ERROR',
      });
    }
    
    // Gérer les erreurs d'autorisation (403)
    if (error.response.status === 403) {
      return Promise.reject({
        message: "Vous n'avez pas les permissions nécessaires pour cette action.",
        code: 'PERMISSION_DENIED',
      });
    }
    
    // Gérer les erreurs serveur (500+)
    if (error.response.status >= 500) {
      return Promise.reject({
        message: 'Une erreur serveur est survenue. Veuillez réessayer plus tard.',
        code: 'SERVER_ERROR',
      });
    }
    
    // Gérer le rate limiting (429)
    if (error.response.status === 429) {
      const retryAfter = error.response.headers['retry-after'];
      return Promise.reject({
        message: `Trop de requêtes. Réessayez dans ${retryAfter || '60'} secondes.`,
        code: 'RATE_LIMIT',
        retryAfter: parseInt(retryAfter) || 60,
      });
    }
    
    // Autres erreurs
    return Promise.reject({
      message: error.response.data.message || 'Une erreur est survenue',
      code: error.response.data.code || 'UNKNOWN_ERROR',
      status: error.response.status,
    });
  }
);

// Fonctions utilitaires
export const clearCache = () => {
  requestCache.clear();
};

export const clearCacheForUrl = (url) => {
  for (const [key] of requestCache.entries()) {
    if (key.includes(url)) {
      requestCache.delete(key);
    }
  }
};

// Helper pour les requêtes avec retry
export const apiRequestWithRetry = async (config, maxRetries = 3) => {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await axiosInstance(config);
    } catch (error) {
      lastError = error;
      
      // Ne pas retry pour certaines erreurs
      if (
        error.code === 'VALIDATION_ERROR' ||
        error.code === 'PERMISSION_DENIED' ||
        error.status === 404
      ) {
        throw error;
      }
      
      // Attendre avant de retry (backoff exponentiel)
      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, i) * 1000));
      }
    }
  }
  
  throw lastError;
};

// Helper pour les uploads avec progress
export const uploadWithProgress = (url, formData, onProgress) => {
  return axiosInstance.post(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
      if (onProgress) {
        onProgress(percentCompleted);
      }
    },
  });
};

// Helper pour les requêtes parallèles
export const parallelRequests = async (requests) => {
  try {
    const responses = await Promise.all(
      requests.map((config) => axiosInstance(config))
    );
    return responses.map((response) => response.data);
  } catch (error) {
    // Si une requête échoue, toutes échouent
    throw error;
  }
};

// Helper pour les requêtes avec timeout custom
export const requestWithTimeout = (config, timeout) => {
  return axiosInstance({
    ...config,
    timeout,
  });
};

export default axiosInstance;