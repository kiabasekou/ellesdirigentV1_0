// ============================================================================
// frontend/src/hooks/useFormations.js - CORRECTION
// ============================================================================

import { useState, useEffect } from 'react';
// CORRECTION: Importe trainingAPI depuis api.js
import { trainingAPI } from '../api'; // Assurez-vous que le chemin est correct

export const useFormations = (filters = {}) => {
  const [formations, setFormations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchFormations = async () => {
    try {
      setLoading(true);
      // CORRECTION: Utilise trainingAPI.getFormations
      const response = await trainingAPI.getFormations(filters);
      // Supposons que les résultats sont dans response.data.results ou directement dans response.data
      setFormations(response.data.results || response.data);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error("Erreur lors du chargement des formations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFormations();
  }, [JSON.stringify(filters)]); // Dépendance sur les filtres pour refetcher si les filtres changent

  return { formations, loading, error, refetch: fetchFormations };
};

export const useFormation = (id) => {
  const [formation, setFormation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFormation = async () => {
      if (!id) return; // Ne fait rien si l'ID n'est pas fourni

      try {
        setLoading(true);
        // CORRECTION: Utilise trainingAPI.getFormation
        const response = await trainingAPI.getFormation(id);
        setFormation(response.data); // Supposons que la formation est dans response.data
        setError(null);
      } catch (err) {
        setError(err.message);
        console.error(`Erreur lors du chargement de la formation ${id}:`, err);
      } finally {
        setLoading(false);
      }
    };

    fetchFormation();
  }, [id]); // Dépendance sur l'ID pour refetcher si l'ID change

  return { formation, loading, error };
};

export const useMesFormations = () => {
  const [inscriptions, setInscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMesFormations = async () => {
    try {
      setLoading(true);
      // CORRECTION: Utilise trainingAPI.getInscriptions pour récupérer les formations auxquelles l'utilisateur est inscrit
      const response = await trainingAPI.getInscriptions();
      setInscriptions(response.data.results || response.data); // Supposons que les inscriptions sont dans response.data.results ou directement dans response.data
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error("Erreur lors du chargement de mes formations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMesFormations();
  }, []); // Exécute une seule fois au montage

  return { inscriptions, loading, error, refetch: fetchMesFormations };
};
