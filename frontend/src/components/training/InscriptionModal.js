import React, { useState } from 'react';
import { X, Calendar, MapPin, Users, Clock, Award, AlertCircle, CheckCircle } from 'lucide-react';

const InscriptionModal = ({ formation, isOpen, onClose, onConfirm }) => {
  const [loading, setLoading] = useState(false);
  const [acceptConditions, setAcceptConditions] = useState(false);

  if (!isOpen || !formation) return null;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleConfirm = async () => {
    if (!acceptConditions) {
      alert('Veuillez accepter les conditions d\'inscription.');
      return;
    }

    setLoading(true);
    try {
      await onConfirm(formation.id);
      onClose();
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Confirmer l'inscription</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formation details */}
        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{formation.titre}</h3>
            <p className="text-gray-600 leading-relaxed">{formation.description}</p>
          </div>

          {/* Informations pratiques */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-gray-900 mb-3">Informations pratiques</h4>
            <div className="space-y-3">
              <div className="flex items-center text-sm">
                <Calendar className="w-4 h-4 mr-3 text-blue-500" />
                <div>
                  <span className="font-medium">Début:</span> {formatDate(formation.date_debut)}
                </div>
              </div>
              <div className="flex items-center text-sm">
                <Calendar className="w-4 h-4 mr-3 text-red-500" />
                <div>
                  <span className="font-medium">Fin:</span> {formatDate(formation.date_fin)}
                </div>
              </div>
              <div className="flex items-center text-sm">
                <Clock className="w-4 h-4 mr-3 text-green-500" />
                <div>
                  <span className="font-medium">Durée:</span> {formation.duree_heures} heures
                </div>
              </div>
              <div className="flex items-center text-sm">
                <MapPin className="w-4 h-4 mr-3 text-purple-500" />
                <div>
                  <span className="font-medium">Lieu:</span> {formation.lieu}
                </div>
              </div>
              <div className="flex items-center text-sm">
                <Users className="w-4 h-4 mr-3 text-orange-500" />
                <div>
                  <span className="font-medium">Places disponibles:</span> {formation.places_disponibles}
                </div>
              </div>
            </div>
          </div>

          {/* Formateur */}
          <div className="mb-6">
            <h4 className="font-semibold text-gray-900 mb-2">Formateur</h4>
            <p className="text-sm text-gray-700">{formation.formateur}</p>
            {formation.formateur_bio && (
              <p className="text-sm text-gray-600 mt-1">{formation.formateur_bio}</p>
            )}
          </div>

          {/* Certification */}
          {formation.certificat_delivre && (
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-5 h-5 text-blue-600" />
                <h4 className="font-semibold text-blue-900">Certification</h4>
              </div>
              <p className="text-sm text-blue-800">
                Un certificat officiel vous sera délivré à la fin de cette formation.
                {formation.quiz_requis && (
                  <span className="block mt-1">
                    <AlertCircle className="w-4 h-4 inline mr-1" />
                    Un quiz de validation avec une note minimale de {formation.note_minimale}% est requis.
                  </span>
                )}
              </p>
            </div>
          )}

          {/* Prix */}
          <div className="mb-6">
            <h4 className="font-semibold text-gray-900 mb-2">Coût</h4>
            {formation.cout > 0 ? (
              <div className="text-2xl font-bold text-green-600">
                {formation.cout.toLocaleString()} FCFA
              </div>
            ) : (
              <div className="text-2xl font-bold text-green-600 flex items-center gap-2">
                <CheckCircle className="w-6 h-6" />
                Gratuit
              </div>
            )}
          </div>

          {/* Conditions */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="accept-conditions"
                checked={acceptConditions}
                onChange={(e) => setAcceptConditions(e.target.checked)}
                className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="accept-conditions" className="text-sm text-gray-700 leading-relaxed">
                J'accepte les conditions d'inscription et je m'engage à participer activement à cette formation.
                Je comprends que mon absence non justifiée peut entraîner l'exclusion de futures formations.
              </label>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || !acceptConditions}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-lg hover:from-blue-700 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Inscription...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Confirmer l'inscription
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InscriptionModal;