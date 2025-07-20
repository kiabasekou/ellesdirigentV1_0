import React from 'react';
import { Award } from 'lucide-react';

const CertificatesPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center">
            <Award className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Mes Certificats</h1>
              <p className="text-gray-600">Vos certifications obtenues</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <Award className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Certificats à venir</h2>
          <p className="text-gray-600">Vos certificats apparaîtront ici une fois les formations terminées</p>
        </div>
      </div>
    </div>
  );
};

export default CertificatesPage;