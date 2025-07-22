// ============================================================================
// frontend/src/components/training/CertificatesPage.js - CORRECTION
// ============================================================================

import React from 'react';
import { Award, Download, Eye, Calendar, CheckCircle } from 'lucide-react';
// CORRECTION: Importe trainingAPI depuis api.js
import { trainingAPI } from '../../api'; // Assurez-vous que le chemin est correct

const CertificatesPage = () => {
  const [certificats, setCertificats] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchCertificats = async () => {
      try {
        // CORRECTION: Utilise trainingAPI.getCertificats()
        const response = await trainingAPI.getCertificats();
        setCertificats(response.data); // Supposons que les certificats sont dans response.data
      } catch (error) {
        console.error('Erreur lors du chargement des certificats:', error);
        // Gérer l'erreur, par exemple afficher un message à l'utilisateur
      } finally {
        setLoading(false);
      }
    };

    fetchCertificats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

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
        {certificats.length === 0 ? (
          <div className="text-center py-12">
            <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun certificat</h3>
            <p className="text-gray-600">Complétez des formations pour obtenir vos premiers certificats.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certificats.map(certificat => (
              <div key={certificat.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <Award className="w-8 h-8 text-blue-600" />
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {certificat.formation_titre}
                </h3>

                <div className="text-sm text-gray-600 mb-4">
                  <div className="flex items-center mb-1">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>Obtenu le {new Date(certificat.date_generation).toLocaleDateString('fr-FR')}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    N° {certificat.numero_certificat}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                    <Eye className="w-4 h-4" />
                    Voir
                  </button>
                  <button className="flex items-center justify-center gap-2 border border-blue-600 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50">
                    <Download className="w-4 h-4" />
                    PDF
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CertificatesPage;
