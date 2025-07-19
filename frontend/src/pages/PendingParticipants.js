/**
 * Page de gestion des participantes en attente de validation
 * Permet de valider ou rejeter les demandes d'inscription
 */
import React, { useState, useEffect } from 'react';
import {
  User,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  MapPin,
  Calendar,
  Briefcase,
  Eye,
  Download,
  AlertCircle,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Shield
} from 'lucide-react';
import axios from '../../api/axiosInstance';
// Ancienne ligne: import { toast } from '../Toast';
// *** CORRECTION : Chemin corrigé pour Toast.js dans src/components ***
//import { toast } from '../../components/Toast'; // Ajustement du chemin
import { toast } from '../../components/Toast'; // Assurez-vous que cette ligne est correcte et sauvegardée


  // ... le reste du code est inchangé
const PendingParticipants = () => {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRegion, setFilterRegion] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [processingId, setProcessingId] = useState(null);

  const regions = [
    { value: 'all', label: 'Toutes les régions' },
    { value: 'estuaire', label: 'Estuaire' },
    { value: 'haut_ogooue', label: 'Haut-Ogooué' },
    { value: 'moyen_ogooue', label: 'Moyen-Ogooué' },
    { value: 'ngounie', label: 'Ngounié' },
    { value: 'nyanga', label: 'Nyanga' },
    { value: 'ogooue_ivindo', label: 'Ogooué-Ivindo' },
    { value: 'ogooue_lolo', label: 'Ogooué-Lolo' },
    { value: 'ogooue_maritime', label: 'Ogooué-Maritime' },
    { value: 'woleu_ntem', label: 'Woleu-Ntem' }
  ];

  const rejectReasons = [
    "Document justificatif invalide ou illisible",
    "NIP non conforme ou invalide",
    "Informations incomplètes ou incorrectes",
    "Âge non conforme aux critères",
    "Doublon - Compte déjà existant",
    "Autre (préciser)"
  ];

  useEffect(() => {
    fetchPendingParticipants();
  }, [currentPage, searchTerm, filterRegion]);

  const fetchPendingParticipants = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        search: searchTerm,
        statut_validation: 'en_attente'
      };
      
      if (filterRegion !== 'all') {
        params.region = filterRegion;
      }

      const response = await axios.get('/api/users/', { params });
      setParticipants(response.data.results);
      setTotalPages(response.data.total_pages);
    } catch (error) {
      console.error('Erreur chargement participantes:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async (participant) => {
    try {
      setProcessingId(participant.id);
      await axios.patch(`/api/users/${participant.id}/validate/`, {
        statut_validation: 'validee'
      });
      
      toast.success(`${participant.first_name} ${participant.last_name} a été validée avec succès`);
      
      // Retirer de la liste
      setParticipants(prev => prev.filter(p => p.id !== participant.id));
      setSelectedParticipant(null);
    } catch (error) {
      console.error('Erreur validation:', error);
      toast.error('Erreur lors de la validation');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error('Veuillez fournir une raison de rejet');
      return;
    }

    try {
      setProcessingId(selectedParticipant.id);
      await axios.patch(`/api/users/${selectedParticipant.id}/reject/`, {
        statut_validation: 'rejetee',
        motif_rejet: rejectReason
      });
      
      toast.success('La demande a été rejetée');
      
      // Retirer de la liste
      setParticipants(prev => prev.filter(p => p.id !== selectedParticipant.id));
      setShowRejectModal(false);
      setSelectedParticipant(null);
      setRejectReason('');
    } catch (error) {
      console.error('Erreur rejet:', error);
      toast.error('Erreur lors du rejet');
    } finally {
      setProcessingId(null);
    }
  };

  const openRejectModal = (participant) => {
    setSelectedParticipant(participant);
    setShowRejectModal(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getExperienceLabel = (experience) => {
    const labels = {
      'aucune': 'Aucune',
      'locale': 'Locale',
      'regionale': 'Régionale',
      'nationale': 'Nationale'
    };
    return labels[experience] || experience;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* En-tête */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Participantes en attente</h1>
            <p className="text-gray-600 mt-1">
              Gérez les demandes d'inscription en attente de validation
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="w-8 h-8 text-yellow-500" />
            <span className="text-2xl font-bold text-gray-900">{participants.length}</span>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Rechercher par nom, email, ville..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
            />
          </div>
          
          <div className="flex items-center space-x-4">
            <select
              value={filterRegion}
              onChange={(e) => setFilterRegion(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            >
              {regions.map(region => (
                <option key={region.value} value={region.value}>
                  {region.label}
                </option>
              ))}
            </select>
            
            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Filter className="w-4 h-4" />
              <span>Plus de filtres</span>
            </button>
          </div>
        </div>
      </div>

      {/* Liste des participantes */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {participants.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucune demande en attente
            </h3>
            <p className="text-gray-600">
              Toutes les demandes ont été traitées.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {participants.map((participant) => (
              <div key={participant.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 font-bold text-lg">
                        {participant.first_name[0]}{participant.last_name[0]}
                      </span>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {participant.first_name} {participant.last_name}
                        </h3>
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                          En attente
                        </span>
                      </div>
                      
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4" />
                          <span>{participant.email}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Shield className="w-4 h-4" />
                          <span>NIP: {participant.nip.slice(0, 4)}****{participant.nip.slice(-4)}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4" />
                          <span>{participant.ville}, {participant.region}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Briefcase className="w-4 h-4" />
                          <span>Expérience: {getExperienceLabel(participant.experience)}</span>
                        </div>
                      </div>
                      
                      <div className="mt-3 flex items-center space-x-4 text-sm">
                        <div className="flex items-center space-x-1 text-gray-500">
                          <Calendar className="w-4 h-4" />
                          <span>Inscrite le {formatDate(participant.date_joined)}</span>
                        </div>
                        
                        {participant.document_justificatif && (
                          <a
                            href={participant.document_justificatif}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-1 text-blue-600 hover:text-blue-700"
                          >
                            <FileText className="w-4 h-4" />
                            <span>Document justificatif</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => setSelectedParticipant(participant)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Voir les détails"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    
                    <button
                      onClick={() => handleValidate(participant)}
                      disabled={processingId === participant.id}
                      className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Valider"
                    >
                      <CheckCircle className="w-5 h-5" />
                    </button>
                    
                    <button
                      onClick={() => openRejectModal(participant)}
                      disabled={processingId === participant.id}
                      className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Rejeter"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-700">
                Page {currentPage} sur {totalPages}
              </p>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`px-3 py-1 rounded-lg ${
                      currentPage === i + 1
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de détails */}
      {selectedParticipant && !showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  Détails de la demande
                </h2>
                <button
                  onClick={() => setSelectedParticipant(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Informations personnelles */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Informations personnelles
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nom complet</label>
                    <p className="mt-1 text-gray-900">
                      {selectedParticipant.first_name} {selectedParticipant.last_name}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-gray-900">{selectedParticipant.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Téléphone</label>
                    <p className="mt-1 text-gray-900">{selectedParticipant.phone || 'Non renseigné'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date de naissance</label>
                    <p className="mt-1 text-gray-900">
                      {selectedParticipant.date_of_birth 
                        ? new Date(selectedParticipant.date_of_birth).toLocaleDateString('fr-FR')
                        : 'Non renseignée'}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Localisation */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Localisation</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Région</label>
                    <p className="mt-1 text-gray-900">{selectedParticipant.region}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Ville</label>
                    <p className="mt-1 text-gray-900">{selectedParticipant.ville}</p>
                  </div>
                </div>
              </div>
              
              {/* Expérience */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Expérience politique
                </h3>
                <p className="text-gray-900">
                  {getExperienceLabel(selectedParticipant.experience)}
                </p>
              </div>
              
              {/* Document justificatif */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Document justificatif
                </h3>
                {selectedParticipant.document_justificatif ? (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-8 h-8 text-blue-600" />
                        <div>
                          <p className="font-medium text-gray-900">
                            Document NIP
                          </p>
                          <p className="text-sm text-gray-500">
                            Cliquez pour visualiser
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <a
                          href={selectedParticipant.document_justificatif}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Voir"
                        >
                          <Eye className="w-5 h-5" />
                        </a>
                        <a
                          href={selectedParticipant.document_justificatif}
                          download
                          className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                          title="Télécharger"
                        >
                          <Download className="w-5 h-5" />
                        </a>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">Aucun document fourni</p>
                )}
              </div>
              
              {/* Actions */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setSelectedParticipant(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Fermer
                </button>
                <button
                  onClick={() => openRejectModal(selectedParticipant)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Rejeter
                </button>
                <button
                  onClick={() => handleValidate(selectedParticipant)}
                  disabled={processingId === selectedParticipant.id}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  Valider la demande
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de rejet */}
      {showRejectModal && selectedParticipant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Rejeter la demande</h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-yellow-800">
                      Vous êtes sur le point de rejeter la demande de{' '}
                      <strong>{selectedParticipant.first_name} {selectedParticipant.last_name}</strong>.
                    </p>
                    <p className="text-sm text-yellow-700 mt-1">
                      Cette action est définitive.
                    </p>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motif du rejet *
                </label>
                <div className="space-y-2">
                  {rejectReasons.map((reason, index) => (
                    <label key={index} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="rejectReason"
                        value={reason}
                        checked={rejectReason === reason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        className="text-blue-600"
                      />
                      <span className="text-sm text-gray-700">{reason}</span>
                    </label>
                  ))}
                </div>
                
                {rejectReason === "Autre (préciser)" && (
                  <textarea
                    className="mt-3 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    placeholder="Précisez le motif de rejet..."
                    value={rejectReason === "Autre (préciser)" ? '' : rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                  />
                )}
              </div>
              
              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectReason('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleReject}
                  disabled={!rejectReason.trim() || processingId === selectedParticipant.id}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  Confirmer le rejet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingParticipants;