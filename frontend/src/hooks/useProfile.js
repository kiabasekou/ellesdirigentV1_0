import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { profileService } from '../services/profileService';

export const useProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const user = useSelector(state => state.auth.user);

  const fetchProfile = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await profileService.getProfile();
      setProfile(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors du chargement du profil');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const updateProfile = async (data) => {
    try {
      const updatedProfile = await profileService.updateProfile(data);
      setProfile(updatedProfile);
      return updatedProfile;
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Erreur lors de la mise à jour');
    }
  };

  const uploadAvatar = async (formData, options = {}) => {
    try {
      const response = await profileService.uploadAvatar(formData, options.onUploadProgress);
      setProfile(prev => ({ ...prev, avatar: response.avatar }));
      return response;
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Erreur lors de l\'upload');
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    loading,
    error,
    updateProfile,
    uploadAvatar,
    refetch: fetchProfile
  };
};