// src/redux/authSlice.js
import { createSlice } from '@reduxjs/toolkit';

// Fonction helper pour décoder un JWT de manière sécurisée
const decodeToken = (token) => {
  try {
    if (!token || typeof token !== 'string') {
      return null;
    }
    
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    
    // Remplacer les caractères URL-safe par les caractères Base64 standards
    const base64 = parts[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    
    // Ajouter le padding si nécessaire
    const pad = base64.length % 4;
    const paddedBase64 = pad ? base64 + '===='.substring(pad) : base64;
    
    const decoded = atob(paddedBase64);
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Erreur décodage token:', error);
    return null;
  }
};

// Fonction pour récupérer les données du localStorage de manière sécurisée
const getStoredAuth = () => {
  try {
    const token = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');
    const userId = localStorage.getItem('user_id');
    
    if (!token) {
      return {
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        sessionInfo: null
      };
    }
    
    // Décoder le token pour vérifier s'il est valide
    const decoded = decodeToken(token);
    
    if (!decoded) {
      // Token invalide, nettoyer le localStorage
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_id');
      
      return {
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        sessionInfo: null
      };
    }
    
    // Vérifier si le token n'est pas expiré
    const currentTime = Date.now() / 1000;
    if (decoded.exp && decoded.exp < currentTime) {
      // Token expiré
      return {
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        sessionInfo: null
      };
    }
    
    return {
      user: {
        id: userId || decoded.user_id,
        username: decoded.username,
        email: decoded.email,
        is_validated: decoded.is_validated || false,
        is_staff: decoded.is_staff || false,
        is_superuser: decoded.is_superuser || false
      },
      token: token,
      refreshToken: refreshToken,
      isAuthenticated: true,
      sessionInfo: {
        exp: decoded.exp,
        iat: decoded.iat
      }
    };
  } catch (error) {
    console.error('Erreur récupération auth:', error);
    return {
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      sessionInfo: null
    };
  }
};

// État initial
const initialState = {
  ...getStoredAuth(),
  error: null
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess: (state, action) => {
      const { access, refresh, user } = action.payload;
      
      // Stocker dans localStorage
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      
      // Décoder le token pour obtenir les infos utilisateur
      const decoded = decodeToken(access);
      
      if (decoded) {
        localStorage.setItem('user_id', decoded.user_id || user?.id);
        
        state.user = {
          id: decoded.user_id || user?.id,
          username: decoded.username || user?.username,
          email: decoded.email || user?.email,
          is_validated: decoded.is_validated || user?.is_validated || false,
          is_staff: decoded.is_staff || user?.is_staff || false,
          is_superuser: decoded.is_superuser || user?.is_superuser || false,
          ...user // Inclure toutes les autres infos de l'utilisateur
        };
        
        state.sessionInfo = {
          exp: decoded.exp,
          iat: decoded.iat
        };
      } else if (user) {
        // Si le décodage échoue, utiliser les infos de la réponse
        localStorage.setItem('user_id', user.id);
        state.user = user;
        state.sessionInfo = null;
      }
      
      state.token = access;
      state.refreshToken = refresh;
      state.isAuthenticated = true;
      state.error = null;
    },
    
    loginFailure: (state, action) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.sessionInfo = null;
      state.error = action.payload;
    },
    
    logout: (state) => {
      // Nettoyer localStorage
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_id');
      
      // Réinitialiser l'état
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.sessionInfo = null;
      state.error = null;
    },
    
    refreshToken: (state, action) => {
      const { access } = action.payload;
      localStorage.setItem('access_token', access);
      state.token = access;
      
      // Mettre à jour sessionInfo si possible
      const decoded = decodeToken(access);
      if (decoded) {
        state.sessionInfo = {
          exp: decoded.exp,
          iat: decoded.iat
        };
      }
    },
    
    // Alias pour la compatibilité
    refreshTokenSuccess: (state, action) => {
      authSlice.caseReducers.refreshToken(state, action);
    },
    
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
    },
    
    clearError: (state) => {
      state.error = null;
    }
  }
});

export const {
  loginSuccess,
  loginFailure,
  logout,
  refreshToken,
  refreshTokenSuccess,
  updateUser,
  clearError
} = authSlice.actions;

export default authSlice.reducer;

// Sélecteurs de base
export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthError = (state) => state.auth.error;
export const selectToken = (state) => state.auth.token;

// Sélecteurs additionnels pour la compatibilité
export const selectIsValidated = (state) => state.auth.user?.is_validated || false;
export const selectSessionInfo = (state) => state.auth.sessionInfo;
export const selectIsAdmin = (state) => state.auth.user?.is_staff || state.auth.user?.is_superuser || false;