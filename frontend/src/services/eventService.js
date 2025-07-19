import axiosInstance from '../api/axiosInstance';

export const eventService = {
  // Récupérer les événements
  getEvents: async (params = {}) => {
    const response = await axiosInstance.get('/api/events/', { params });
    return response.data;
  },

  // Détail d'un événement
  getEvent: async (eventId) => {
    const response = await axiosInstance.get(`/api/events/${eventId}/`);
    return response.data;
  },

  // Inscription à un événement
  registerForEvent: async (eventId, data = {}) => {
    const response = await axiosInstance.post(`/api/events/${eventId}/register/`, data);
    return response.data;
  },

  // Désinscription
  unregisterFromEvent: async (eventId) => {
    await axiosInstance.delete(`/api/events/${eventId}/unregister/`);
  },

  // Participants d'un événement
  getEventParticipants: async (eventId) => {
    const response = await axiosInstance.get(`/api/events/${eventId}/participants/`);
    return response.data;
  },

  // Créer un événement
  createEvent: async (data) => {
    const response = await axiosInstance.post('/api/events/', data);
    return response.data;
  },

  // Mettre à jour un événement
  updateEvent: async (eventId, data) => {
    const response = await axiosInstance.patch(`/api/events/${eventId}/`, data);
    return response.data;
  },

  // Supprimer un événement
  deleteEvent: async (eventId) => {
    await axiosInstance.delete(`/api/events/${eventId}/`);
  },

  // Exporter au calendrier
  exportToCalendar: async (eventId) => {
    const response = await axiosInstance.get(`/api/events/${eventId}/export/`, {
      responseType: 'blob'
    });
    return response.data;
  }
};