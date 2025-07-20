import React from 'react';
import { Calendar, Users, Clock, MapPin, Award, Wifi } from 'lucide-react';
import { Link } from 'react-router-dom';

const FormationCard = ({ formation }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getNiveauColor = (niveau) => {
    const colors = {
      'debutant': 'bg-green-100 text-green-800',
      'intermediaire': 'bg-yellow-100 text-yellow-800',
      'avance': 'bg-red-100 text-red-800'
    };
    return colors[niveau] || 'bg-gray-100 text-gray-800';
  };

  const getCategorieColor = (categorie) => {
    const colors = {
      'leadership': 'bg-blue-500',
      'communication': 'bg-purple-500',
      'campagne': 'bg-red-500',
      'gouvernance': 'bg-green-500',
      'negociation': 'bg-orange-500',
      'droits_femmes': 'bg-pink-500',
      'economie': 'bg-indigo-500'
    };
    return colors[categorie] || 'bg-gray-500';
  };

  return (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
      {/* Image de couverture */}
      <div className="relative h-48 bg-gradient-to-r from-blue-600 to-green-600">
        {formation.image_cover ? (
          <img 
            src={formation.image_cover} 
            alt={formation.titre}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Award className="w-16 h-16 text-white opacity-80" />
          </div>
        )}
        
        {/* Badge catégorie */}
        <div className="absolute top-4 left-4">
          <span className={`px-3 py-1 rounded-full text-white text-sm font-medium ${getCategorieColor(formation.categorie)}`}>
            {formation.categorie}
          </span>
        </div>
        
        {/* Badge en ligne */}
        {formation.est_en_ligne && (
          <div className="absolute top-4 right-4">
            <div className="bg-white bg-opacity-90 rounded-full p-2">
              <Wifi className="w-4 h-4 text-blue-600" />
            </div>
          </div>
        )}
      </div>

      <div className="p-6">
        {/* En-tête */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
              {formation.titre}
            </h3>
            <div className="flex items-center gap-2 mb-3">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getNiveauColor(formation.niveau)}`}>
                {formation.niveau}
              </span>
              {formation.certificat_delivre && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                  Certifiant
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {formation.description}
        </p>

        {/* Informations pratiques */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-500">
            <Calendar className="w-4 h-4 mr-2" />
            <span>{formatDate(formation.date_debut)}</span>
          </div>
          
          <div className="flex items-center text-sm text-gray-500">
            <Clock className="w-4 h-4 mr-2" />
            <span>{formation.duree_heures}h</span>
          </div>
          
          <div className="flex items-center text-sm text-gray-500">
            <MapPin className="w-4 h-4 mr-2" />
            <span>{formation.lieu}</span>
          </div>
          
          <div className="flex items-center text-sm text-gray-500">
            <Users className="w-4 h-4 mr-2" />
            <span>{formation.participants_count}/{formation.max_participants} participants</span>
          </div>
        </div>

        {/* Formateur */}
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Formateur:</span> {formation.formateur}
          </p>
        </div>

        {/* Prix */}
        {formation.cout > 0 ? (
          <div className="mb-4">
            <span className="text-lg font-bold text-green-600">{formation.cout} FCFA</span>
          </div>
        ) : (
          <div className="mb-4">
            <span className="text-lg font-bold text-green-600">Gratuit</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Link
            to={`/formations/${formation.id}`}
            className="flex-1 bg-gradient-to-r from-blue-600 to-green-600 text-white text-center py-2 px-4 rounded-lg hover:from-blue-700 hover:to-green-700 transition-colors duration-200 font-medium"
          >
            Voir détails
          </Link>
          
          {formation.est_complete ? (
            <button 
              disabled
              className="px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed"
            >
              Complet
            </button>
          ) : (
            <button className="px-4 py-2 bg-white border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors duration-200 font-medium">
              S'inscrire
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FormationCard;