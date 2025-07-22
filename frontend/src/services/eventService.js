// ============================================================================
// frontend/src/services/eventService.js - CORRECTION
// ============================================================================

// CORRECTION: Importe l'instance 'api' par défaut et l'objet 'eventsAPI'
import api, { eventsAPI } from '../api'; // Assurez-vous que le chemin est correct

export const eventService = {
  // Récupérer les événements
  getEvents: async (params = {}) => {
    // CORRECTION: Utilise eventsAPI.getEvents
    const response = await eventsAPI.getEvents(params);
    return response.data;
  },

  // Détail d'un événement
  getEvent: async (eventId) => {
    // CORRECTION: Utilise eventsAPI.getEvent
    const response = await eventsAPI.getEvent(eventId);
    return response.data;
  },

  // Inscription à un événement
  registerForEvent: async (eventId, data = {}) => {
    // CORRECTION: Utilise eventsAPI.inscrireEvent.
    // Note: La fonction `inscrireEvent` dans api.js ne semble pas prendre de 'data' en paramètre.
    // Si votre backend nécessite des données supplémentaires pour l'inscription,
    // vous devrez adapter `eventsAPI.inscrireEvent` dans api.js.
    const response = await eventsAPI.inscrireEvent(eventId);
    return response.data;
  },

  // Désinscription
  unregisterFromEvent: async (eventId) => {
    // CORRECTION: Utilise eventsAPI.desinscrireEvent
    await eventsAPI.desinscrireEvent(eventId);
  },

  // Participants d'un événement
  getEventParticipants: async (eventId) => {
    // Cette fonction n'existe pas directement dans eventsAPI.
    // Nous utilisons l'instance 'api' par défaut avec l'endpoint complet.
    const response = await api.get(`/events/events/${eventId}/participants/`);
    return response.data;
  },

  // Créer un événement
  createEvent: async (data) => {
    // CORRECTION: Utilise eventsAPI.createEvent
    const response = await eventsAPI.createEvent(data);
    return response.data;
  },

  // Mettre à jour un événement
  updateEvent: async (eventId, data) => {
    // CORRECTION: Utilise eventsAPI.updateEvent.
    // Note: La fonction `updateEvent` dans api.js utilise PUT, tandis que l'original ici utilisait PATCH.
    // Assurez-vous que l'opération PUT est appropriée pour votre backend.
    const response = await eventsAPI.updateEvent(eventId, data);
    return response.data;
  },

  // Supprimer un événement
  deleteEvent: async (eventId) => {
    // CORRECTION: Utilise eventsAPI.deleteEvent
    await eventsAPI.deleteEvent(eventId);
  },

  // Exporter au calendrier
  exportToCalendar: async (eventId) => {
    // Cette fonction n'existe pas directement dans eventsAPI.
    // Nous utilisons l'instance 'api' par défaut avec l'endpoint complet.
    const response = await api.get(`/events/events/${eventId}/export/`, {
      responseType: 'blob'
    });
    return response.data;
  }
};
