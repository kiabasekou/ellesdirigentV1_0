// ============================================================================
// frontend/src/services/forumService.js - CORRECTION
// ============================================================================

// CORRECTION: Importe l'instance 'api' par défaut depuis api.js
import api from '../api'; // Assurez-vous que le chemin est correct

export const forumService = {
  // Catégories
  getCategories: async () => {
    // CORRECTION: Utilise api.get et supprime le préfixe /api/
    const response = await api.get('/forums/categories/');
    return response.data;
  },

  // Threads
  getThreads: async (categoryId, params = {}) => {
    // CORRECTION: Utilise api.get et supprime le préfixe /api/
    const response = await api.get(`/forums/categories/${categoryId}/threads/`, { params });
    return response.data;
  },

  createThread: async (data) => {
    // CORRECTION: Utilise api.post et supprime le préfixe /api/
    const response = await api.post('/forums/threads/', data);
    return response.data;
  },

  getThread: async (threadId) => {
    // CORRECTION: Utilise api.get et supprime le préfixe /api/
    const response = await api.get(`/forums/threads/${threadId}/`);
    return response.data;
  },

  // Posts
  getPosts: async (threadId, params = {}) => {
    // CORRECTION: Utilise api.get et supprime le préfixe /api/
    const response = await api.get(`/forums/threads/${threadId}/posts/`, { params });
    return response.data;
  },

  createPost: async (threadId, data) => {
    // CORRECTION: Utilise api.post et supprime le préfixe /api/
    const response = await api.post(`/forums/threads/${threadId}/posts/`, data);
    return response.data;
  },

  updatePost: async (postId, data) => {
    // CORRECTION: Utilise api.patch et supprime le préfixe /api/
    const response = await api.patch(`/forums/posts/${postId}/`, data);
    return response.data;
  },

  deletePost: async (postId) => {
    // CORRECTION: Utilise api.delete et supprime le préfixe /api/
    await api.delete(`/forums/posts/${postId}/`);
  },

  // Interactions
  likePost: async (postId) => {
    // CORRECTION: Utilise api.post et supprime le préfixe /api/
    const response = await api.post(`/forums/posts/${postId}/like/`);
    return response.data;
  },

  // Recherche
  searchThreads: async (query) => {
    // CORRECTION: Utilise api.get et supprime le préfixe /api/
    const response = await api.get('/forums/search/', { params: { q: query } });
    return response.data;
  }
};
