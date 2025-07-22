// ============================================================================
// frontend/src/pages/admin/training/EditFormation.js - CORRECTION
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, X, ArrowLeft } from 'lucide-react';
// CORRECTION: Importe trainingAPI depuis '../../api' et toast
import { trainingAPI } from '../../../api'; // Assurez-vous que le chemin est correct
import { toast } from '../../../components/Toast'; // Assurez-vous que le chemin est correct

const EditFormation = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formation, setFormation] = useState(null);

  useEffect(() => {
    fetchFormation();
  }, [id]);

  const fetchFormation = async () => {
    try {
      // CORRECTION: Utilise trainingAPI.getFormation
      const response = await trainingAPI.getFormation(id);
      const data = response.data; // Supposons que la formation est directement dans response.data

      // Formater les dates pour l'input datetime-local
      const formattedData = {
        ...data,
        date_debut: data.date_debut ? new Date(data.date_debut).toISOString().slice(0, 16) : '',
        date_fin: data.date_fin ? new Date(data.date_fin).toISOString().slice(0, 16) : ''
      };
      setFormation(formattedData);
    } catch (error) {
      console.error('Erreur lors du chargement de la formation:', error);
      // CORRECTION: Utilise toast.error au lieu de alert
      toast.error('Erreur lors du chargement de la formation.');
      navigate('/admin/formations');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // CORRECTION: Utilise trainingAPI.updateFormation
      await trainingAPI.updateFormation(id, formation);
      // CORRECTION: Utilise toast.success au lieu de alert
      toast.success('Formation modifiée avec succès !');
      navigate('/admin/formations');
    } catch (error) {
      console.error('Erreur lors de la modification de la formation:', error);
      // CORRECTION: Utilise toast.error au lieu de alert
      toast.error('Erreur lors de la modification de la formation.');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setFormation(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement de la formation...</p>
        </div>
      </div>
    );
  }

  if (!formation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Formation non trouvée</p>
          <button
            onClick={() => navigate('/admin/formations')}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            Retour à la liste
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/admin/formations')}
                className="mr-4 p-2 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Modifier la Formation</h1>
                <p className="text-gray-600">Mettre à jour les informations de la formation</p>
              </div>
            </div>
            <button
              type="button" // Ajout de type="button" pour éviter la soumission du formulaire
              onClick={() => navigate('/admin/formations')}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <X className="w-4 h-4" />
              Annuler
            </button>
          </div>
        </div>
      </div>

      {/* Formulaire simplifié */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Informations générales</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Titre de la formation *
                </label>
                <input
                  type="text"
                  value={formation.titre || ''}
                  onChange={(e) => handleChange('titre', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Catégorie *
                </label>
                <select
                  value={formation.categorie || ''}
                  onChange={(e) => handleChange('categorie', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="leadership">Leadership</option>
                  <option value="communication">Communication</option>
                  <option value="campagne">Campagne électorale</option>
                  <option value="gouvernance">Gouvernance</option>
                  <option value="negociation">Négociation</option>
                  <option value="droits_femmes">Droits des femmes</option>
                  <option value="economie">Économie politique</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Niveau *
                </label>
                <select
                  value={formation.niveau || ''}
                  onChange={(e) => handleChange('niveau', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="debutant">Débutant</option>
                  <option value="intermediaire">Intermédiaire</option>
                  <option value="avance">Avancé</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={formation.description || ''}
                  onChange={(e) => handleChange('description', e.target.value)}
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date de début *
                </label>
                <input
                  type="datetime-local"
                  value={formation.date_debut || ''}
                  onChange={(e) => handleChange('date_debut', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date de fin *
                </label>
                <input
                  type="datetime-local"
                  value={formation.date_fin || ''}
                  onChange={(e) => handleChange('date_fin', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Durée (heures) *
                </label>
                <input
                  type="number"
                  value={formation.duree_heures || ''}
                  onChange={(e) => handleChange('duree_heures', e.target.value)}
                  min="1"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max participants *
                </label>
                <input
                  type="number"
                  value={formation.max_participants || ''}
                  onChange={(e) => handleChange('max_participants', e.target.value)}
                  min="1"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lieu *
                </label>
                <input
                  type="text"
                  value={formation.lieu || ''}
                  onChange={(e) => handleChange('lieu', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Formateur *
                </label>
                <input
                  type="text"
                  value={formation.formateur || ''}
                  onChange={(e) => handleChange('formateur', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/admin/formations')}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-lg hover:from-blue-700 hover:to-green-700 disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Sauvegarder
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditFormation;
