import React from 'react';
import { BookOpen } from 'lucide-react';

const FormationsPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center">
            <BookOpen className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Formations</h1>
              <p className="text-gray-600">Catalogue des formations disponibles</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <BookOpen className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Module Formation en cours de développement</h2>
          <p className="text-gray-600 mb-6">
            Le catalogue des formations sera bientôt disponible avec toutes les fonctionnalités avancées.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 border border-gray-200 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">📚 Catalogue complet</h3>
              <p className="text-sm text-gray-600">Formations en leadership, gouvernance, communication politique</p>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">🎯 Suivi personnalisé</h3>
              <p className="text-sm text-gray-600">Progression individuelle et recommandations adaptées</p>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">🏆 Certifications</h3>
              <p className="text-sm text-gray-600">Certificats officiels reconnus au niveau national</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormationsPage;