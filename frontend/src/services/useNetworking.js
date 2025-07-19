import { useState, useCallback, useEffect } from 'react';
import { networkingService } from '../services/networkingService';

export const useNetworking = () => {
  const [members, setMembers] = useState([]);
  const [connections, setConnections] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMembers = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await networkingService.getMembers(params);
      setMembers(data.results || data);
      return data;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchConnections = useCallback(async () => {
    try {
      const data = await networkingService.getConnections();
      setConnections(data.results || data);
      return data;
    } catch (err) {
      console.error('Erreur chargement connexions:', err);
      return [];
    }
  }, []);

  const fetchRequests = useCallback(async () => {
    try {
      const data = await networkingService.getConnectionRequests();
      setRequests(data.results || data);
      return data;
    } catch (err) {
      console.error('Erreur chargement demandes:', err);
      return [];
    }
  }, []);

  const sendConnectionRequest = async (memberId, data = {}) => {
    try {
      const response = await networkingService.sendConnectionRequest(memberId, data);
      
      // Mettre à jour le membre localement
      setMembers(prev => prev.map(member => 
        member.id === memberId 
          ? { ...member, has_pending_request: true }
          : member
      ));
      
      return response;
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Erreur lors de l\'envoi de la demande');
    }
  };

  const acceptRequest = async (requestId) => {
    try {
      const response = await networkingService.acceptRequest(requestId);
      
      // Retirer la demande de la liste
      setRequests(prev => prev.filter(req => req.id !== requestId));
      
      // Recharger les connexions
      fetchConnections();
      
      return response;
    } catch (err) {
      throw new Error('Erreur lors de l\'acceptation');
    }
  };

  const rejectRequest = async (requestId) => {
    try {
      const response = await networkingService.rejectRequest(requestId);
      
      // Retirer la demande de la liste
      setRequests(prev => prev.filter(req => req.id !== requestId));
      
      return response;
    } catch (err) {
      throw new Error('Erreur lors du refus');
    }
  };

  const searchMembers = useCallback(async (query) => {
    setLoading(true);
    try {
      const data = await networkingService.searchMembers(query);
      setMembers(data.results || data);
      return data;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConnections();
    fetchRequests();
  }, [fetchConnections, fetchRequests]);

  return {
    members,
    connections,
    requests,
    loading,
    error,
    fetchMembers,
    fetchConnections,
    fetchRequests,
    sendConnectionRequest,
    acceptRequest,
    rejectRequest,
    searchMembers
  };
};