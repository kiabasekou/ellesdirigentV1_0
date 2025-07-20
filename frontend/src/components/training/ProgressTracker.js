import React from 'react';
import { CheckCircle, Circle, Clock, Award } from 'lucide-react';

const ProgressTracker = ({ inscription, formation }) => {
  const { progression, modules_completes, statut, temps_passe } = inscription;
  
  const formatDuration = (duration) => {
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    return `${hours}h ${minutes}min`;
  };

  const getStatutColor = (statut) => {
    const colors = {
      'inscrite': 'bg-blue-100 text-blue-800',
      'confirmee': 'bg-green-100 text-green-800',
      'en_cours': 'bg-yellow-100 text-yellow-800',
      'terminee': 'bg-purple-100 text-purple-800',
      'certifiee': 'bg-indigo-100 text-indigo-800'
    };
    return colors[statut] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">Progression</h3>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatutColor(statut)}`}>
          {statut}
        </span>
      </div>

      {/* Barre de progression globale */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Progression globale</span>
          <span className="text-sm font-bold text-gray-900">{progression}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-blue-600 to-green-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${progression}%` }}
          ></div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
          <div className="text-sm text-gray-600">Temps passé</div>
          <div className="text-lg font-bold text-gray-900">
            {temps_passe ? formatDuration(temps_passe) : '0h 0min'}
          </div>
        </div>
        
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <Award className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <div className="text-sm text-gray-600">Modules complétés</div>
          <div className="text-lg font-bold text-gray-900">
            {modules_completes.length}/{formation.modules?.length || 0}
          </div>
        </div>
      </div>

      {/* Liste des modules */}
      {formation.modules && (
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-3">Modules</h4>
          <div className="space-y-3">
            {formation.modules.map((module, index) => {
              const isCompleted = modules_completes.includes(module.id);
              return (
                <div key={module.id} className="flex items-center p-3 border rounded-lg">
                  {isCompleted ? (
                    <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-400 mr-3" />
                  )}
                  <div className="flex-1">
                    <h5 className={`font-medium ${isCompleted ? 'text-gray-900' : 'text-gray-600'}`}>
                      {module.titre}
                    </h5>
                    <p className="text-sm text-gray-500">
                      {module.duree_minutes} minutes
                    </p>
                  </div>
                  {isCompleted && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      Terminé
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressTracker;