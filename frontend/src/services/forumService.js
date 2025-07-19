import axiosInstance from '../api/axiosInstance'; // Utiliser axiosInstance au lieu de api

export const forumService = {
  // Catégories
  getCategories: async () => {
    const response = await axiosInstance.get('/api/forums/categories/');
    return response.data;
  },

  // Threads
  getThreads: async (categoryId, params = {}) => {
    const response = await axiosInstance.get(`/api/forums/categories/${categoryId}/threads/`, { params });
    return response.data;
  },

  createThread: async (data) => {
    const response = await axiosInstance.post('/api/forums/threads/', data);
    return response.data;
  },

  getThread: async (threadId) => {
    const response = await axiosInstance.get(`/api/forums/threads/${threadId}/`);
    return response.data;
  },

  // Posts
  getPosts: async (threadId, params = {}) => {
    const response = await axiosInstance.get(`/api/forums/threads/${threadId}/posts/`, { params });
    return response.data;
  },

  createPost: async (threadId, data) => {
    const response = await axiosInstance.post(`/api/forums/threads/${threadId}/posts/`, data);
    return response.data;
  },

  updatePost: async (postId, data) => {
    const response = await axiosInstance.patch(`/api/forums/posts/${postId}/`, data);
    return response.data;
  },

  deletePost: async (postId) => {
    await axiosInstance.delete(`/api/forums/posts/${postId}/`);
  },

  // Interactions
  likePost: async (postId) => {
    const response = await axiosInstance.post(`/api/forums/posts/${postId}/like/`);
    return response.data;
  },

  // Recherche
  searchThreads: async (query) => {
    const response = await axiosInstance.get('/api/forums/search/', { params: { q: query } });
    return response.data;
  }
};