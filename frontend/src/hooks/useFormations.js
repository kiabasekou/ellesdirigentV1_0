import { useState, useEffect } from 'react';
import TrainingService from '../services/api/training';

export const useFormations = (filters = {}) => {
  const [formations, setFormations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchFormations = async () => {
    try {
      setLoading(true);
      const data = await TrainingService.getFormations(filters);
      setFormations(data.results || data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFormations();
  }, [JSON.stringify(filters)]);

  return { formations, loading, error, refetch: fetchFormations };
};

export const useFormation = (id) => {
  const [formation, setFormation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFormation = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const data = await TrainingService.getFormation(id);
        setFormation(data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFormation();
  }, [id]);

  return { formation, loading, error };
};

export const useMesFormations = () => {
  const [inscriptions, setInscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMesFormations = async () => {
    try {
      setLoading(true);
      const data = await TrainingService.getMesFormations();
      setInscriptions(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMesFormations();
  }, []);

  return { inscriptions, loading, error, refetch: fetchMesFormations };
};