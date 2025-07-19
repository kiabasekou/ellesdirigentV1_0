import { useState, useCallback } from 'react';
import { eventService } from '../services/eventService';

export const useEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchEvents = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await eventService.getEvents(params);
      setEvents(data.results || data);
      return data;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const registerForEvent = async (eventId, formData = {}) => {
    try {
      const response = await eventService.registerForEvent(eventId, formData);
      
      // Mettre à jour l'événement localement
      setEvents(prev => prev.map(event => 
        event.id === eventId 
          ? { ...event, is_registered: true, current_participants: event.current_participants + 1 }
          : event
      ));
      
      return response;
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Erreur lors de l\'inscription');
    }
  };

  const unregisterFromEvent = async (eventId) => {
    try {
      await eventService.unregisterFromEvent(eventId);
      
      // Mettre à jour l'événement localement
      setEvents(prev => prev.map(event => 
        event.id === eventId 
          ? { ...event, is_registered: false, current_participants: event.current_participants - 1 }
          : event
      ));
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Erreur lors de la désinscription');
    }
  };

  return {
    events,
    loading,
    error,
    fetchEvents,
    registerForEvent,
    unregisterFromEvent
  };
};