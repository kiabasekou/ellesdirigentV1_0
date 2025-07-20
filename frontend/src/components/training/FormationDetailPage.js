Créons Le module Formation dédié viendra enrichir cette base avec des fonctionnalités avancées : suivi pédagogique, certificats automatiques, évaluations, et statistiques de progression !


import React from 'react';
import { useParams } from 'react-router-dom';
import { useFormation } from '../../hooks/useFormations';
import FormationDetail from '../../components/training/FormationDetail';

const FormationDetailPage = () => {
  const { id } = useParams();
  const { formation, loading, error } = useFormation(id);

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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return formation ? <FormationDetail formation={formation} /> : null;
};

export default FormationDetailPage;