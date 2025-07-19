import { useState, useCallback } from 'react';
import { resourceService } from '../services/resourceService';

export const useResources = () => {
  const [resources, setResources] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchResources = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await resourceService.getResources(params);
      setResources(data.results || data);
      return data;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const data = await resourceService.getCategories();
      setCategories(data);
      return data;
    } catch (err) {
      console.error('Erreur chargement catégories:', err);
      return [];
    }
  }, []);

  const uploadResource = async (formData, onUploadProgress) => {
    try {
      const response = await resourceService.uploadResource(formData, onUploadProgress);
      setResources(prev => [response, ...prev]);
      return response;
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Erreur lors de l\'upload');
    }
  };

  const downloadResource = async (resourceId) => {
    try {
      const blob = await resourceService.downloadResource(resourceId);
      
      // Incrémenter le compteur localement
      setResources(prev => prev.map(resource => 
        resource.id === resourceId 
          ? { ...resource, download_count: resource.download_count + 1 }
          : resource
      ));
      
      return blob;
    } catch (err) {
      throw new Error('Erreur lors du téléchargement');
    }
  };

  const likeResource = async (resourceId) => {
    try {
      const response = await resourceService.likeResource(resourceId);
      
      // Mettre à jour localement
      setResources(prev => prev.map(resource => 
        resource.id === resourceId 
          ? { 
              ...resource, 
              is_liked: !resource.is_liked,
              likes: resource.is_liked ? resource.likes - 1 : resource.likes + 1
            }
          : resource
      ));
      
      return response;
    } catch (err) {
      throw new Error('Erreur lors de l\'ajout aux favoris');
    }
  };

  const saveResource = async (resourceId) => {
    try {
      const response = await resourceService.saveResource(resourceId);
      
      // Mettre à jour localement
      setResources(prev => prev.map(resource => 
        resource.id === resourceId 
          ? { ...resource, is_saved: !resource.is_saved }
          : resource
      ));
      
      return response;
    } catch (err) {
      throw new Error('Erreur lors de la sauvegarde');
    }
  };

  return {
    resources,
    categories,
    loading,
    error,
    fetchResources,
    fetchCategories,
    uploadResource,
    downloadResource,
    likeResource,
    saveResource
  };
};