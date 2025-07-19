/**
 * Page Réseautage - Connexion et interaction entre membres
 * Recherche de mentors, création de connexions, messagerie
 */
import React, { useState, useEffect } from 'react';
import { 
  Users,
  Search,
  Filter,
  UserPlus,
  MessageSquare,
  Star,
  MapPin,
  Briefcase,
  Award,
  Shield,
  ChevronDown,
  Grid,
  List,
  Globe,
  Heart,
  Send,
  Check,
  X,
  Loader,
  AlertCircle,
  Sparkles,
  Target,
  TrendingUp,
  Calendar
} from 'lucide-react';
import { networkingService } from '../services/networkingService';
import { useNetworking } from '../hooks/useNetworking';
import { toast } from '../components/Toast';
import MemberGrid from '../components/networking/MemberGrid';
import MemberCard from '../components/networking/MemberCard';
import MemberProfile from '../components/networking/MemberProfile';
import ConnectionRequest from '../components/networking/ConnectionRequest';
import NetworkStats from '../components/networking/NetworkStats';

const Networking = () => {
  const { 
    members, 
    connections, 
    requests,
    loading, 
    error, 
    fetchMembers, 
    sendConnectionRequest,
    acceptRequest,
    rejectRequest,
    searchMembers 
  } = useNetworking();

  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [selectedMember, setSelectedMember] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    region: 'all',
    experience: 'all',
    skills: [],
    isMentor: false,
    isOnline: false,
    hasPhoto: false
  });
  const [sortBy, setSortBy] = useState('recent');
  const [activeTab, setActiveTab] = useState('discover'); // 'discover' | 'connections' | 'requests'

  // Régions et expériences
  const regions = [
    'Toutes les régions',
    'Estuaire', 'Haut-Ogooué', 'Moyen-Ogooué', 'Ngounié', 
    'Nyanga', 'Ogooué-Ivindo', 'Ogooué-Lolo', 'Ogooué-Maritime', 'Woleu-Ntem'
  ];

  const experienceLevels = [
    { value: 'all', label: 'Tous niveaux' },
    { value: 'aucune', label: 'Débutante' },
    { value: 'locale', label: 'Niveau local' },
    { value: 'regionale', label: 'Niveau régional' },
    { value: 'nationale', label: 'Niveau national' }
  ];

  const skills = [
    'Leadership', 'Communication', 'Négociation', 'Gestion de projet',
    'Analyse politique', 'Plaidoyer', 'Réseautage', 'Médiation',
    'Prise de parole', 'Rédaction', 'Stratégie', 'Diplomatie'
  ];

  // Membres de démonstration
  const demoMembers = [
    {
      id: 1,
      first_name: 'Marie',
      last_name: 'Nguema',
      username: 'marie.nguema',
      avatar: null,
      region: 'Estuaire',
      ville: 'Libreville',
      experience: 'nationale',
      is_mentor: true,
      is_online: true,
      last_activity: new Date(),
      bio: 'Députée et militante pour les droits des femmes. 15 ans d\'expérience en politique.',
      skills: ['Leadership', 'Communication', 'Stratégie'],
      political_interests: ['Éducation', 'Santé', 'Droits des femmes'],
      current_position: 'Députée',
      organization: 'Assemblée Nationale',
      connections_count: 234,
      is_connected: false,
      has_pending_request: false,
      profile_completion: 95
    },
    {
      id: 2,
      first_name: 'Jeanne',
      last_name: 'Mbadinga',
      username: 'jeanne.mbadinga',
      avatar: null,
      region: 'Haut-Ogooué',
      ville: 'Franceville',
      experience: 'regionale',
      is_mentor: false,
      is_online: false,
      last_activity: new Date(Date.now() - 3600000), // 1 heure
      bio: 'Conseillère municipale passionnée par le développement local et l\'autonomisation des femmes.',
      skills: ['Gestion de projet', 'Plaidoyer', 'Réseautage'],
      political_interests: ['Développement local', 'Environnement', 'Agriculture'],
      current_position: 'Conseillère municipale',
      organization: 'Mairie de Franceville',
      connections_count: 156,
      is_connected: true,
      has_pending_request: false,
      profile_completion: 88
    },
    {
      id: 3,
      first_name: 'Sylvie',
      last_name: 'Oyono',
      username: 'sylvie.oyono',
      avatar: null,
      region: 'Woleu-Ntem',
      ville: 'Oyem',
      experience: 'locale',
      is_mentor: false,
      is_online: true,
      last_activity: new Date(),
      bio: 'Jeune militante engagée pour la participation des femmes en politique. Recherche un mentor.',
      skills: ['Communication', 'Médiation', 'Rédaction'],
      political_interests: ['Justice sociale', 'Éducation', 'Culture'],
      current_position: 'Coordinatrice',
      organization: 'Association Femmes Leaders',
      connections_count: 89,
      is_connected: false,
      has_pending_request: true,
      profile_completion: 75
    }
  ];

  useEffect(() => {
    loadMembers();
  }, [filters, sortBy]);

  const loadMembers = async () => {
    try {
      const params = {
        ...filters,
        sort: sortBy,
        search: searchTerm
      };
      
      await fetchMembers(params);
    } catch (error) {
      console.error('Erreur chargement membres:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadMembers();
  };

  const handleConnect = async (memberId) => {
    setSelectedMember(members.find(m => m.id === memberId));
    setShowRequestModal(true);
  };

  const handleSendRequest = async (memberId, message) => {
    try {
      await sendConnectionRequest(memberId, { message });
      toast.success('Demande de connexion envoyée');
      setShowRequestModal(false);
      
      // Mettre à jour l'état local
      const updatedMembers = members.map(m => 
        m.id === memberId ? { ...m, has_pending_request: true } : m
      );
      // Ici, vous devriez mettre à jour votre état global
    } catch (error) {
      toast.error('Erreur lors de l\'envoi de la demande');
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      await acceptRequest(requestId);
      toast.success('Demande acceptée');
      loadMembers();
    } catch (error) {
      toast.error('Erreur lors de l\'acceptation');
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      await rejectRequest(requestId);
      toast.info('Demande refusée');
      loadMembers();
    } catch (error) {
      toast.error('Erreur lors du refus');
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const filteredMembers = () => {
    let data = members.length > 0 ? members : demoMembers;
    
    // Filtre par onglet actif
    switch (activeTab) {
      case 'connections':
        data = data.filter(m => m.is_connected);
        break;
      case 'requests':
        // Ici, vous afficheriez les demandes de connexion reçues
        return requests || [];
      default:
        // 'discover' - exclure les connexions existantes
        data = data.filter(m => !m.is_connected);
        break;
    }
    
    // Appliquer les autres filtres
    if (searchTerm) {
      data = data.filter(member =>
        member.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.bio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.skills?.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    return data;
  };

  const networkStats = {
    totalConnections: connections?.length || 45,
    pendingRequests: requests?.filter(r => r.status === 'pending').length || 3,
    mentorsAvailable: members.filter(m => m.is_mentor && !m.is_connected).length || 12,
    onlineNow: members.filter(m => m.is_online).length || 23
  };

  if (loading && !members.length) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* En-tête avec statistiques */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h1 className="text-3xl font-bold mb-4">Réseau & Connexions</h1>
            <p className="text-indigo-100 mb-6">
              Connectez-vous avec d'autres femmes leaders, trouvez des mentors 
              et développez votre réseau professionnel
            </p>

            {/* Barre de recherche */}
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-indigo-200" />
              <input
                type="text"
                placeholder="Rechercher des membres..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/20 backdrop-blur-sm rounded-lg placeholder-indigo-200 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
              />
            </form>
          </div>

          {/* Statistiques du réseau */}
          <NetworkStats stats={networkStats} />
        </div>
      </div>

      {/* Onglets de navigation */}
      <div className="bg-white rounded-xl shadow-sm mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {[
              { id: 'discover', label: 'Découvrir', icon: Sparkles },
              { id: 'connections', label: 'Mes connexions', icon: Users },
              { id: 'requests', label: 'Demandes', icon: UserPlus, badge: networkStats.pendingRequests }
            ].map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="flex items-center space-x-2">
                    <IconComponent className="w-5 h-5" />
                    <span>{tab.label}</span>
                    {tab.badge > 0 && (
                      <span className="ml-2 bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full text-xs">
                        {tab.badge}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Contrôles et filtres */}
        <div className="p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center space-x-4">
              {/* Toggle vue */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Grid className="w-4 h-4 inline mr-2" />
                  Grille
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <List className="w-4 h-4 inline mr-2" />
                  Liste
                </button>
              </div>

              {/* Bouton filtres */}
              {activeTab === 'discover' && (
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <Filter className="w-4 h-4" />
                  <span>Filtres</span>
                </button>
              )}

              {/* Tri */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="recent">Plus récents</option>
                <option value="active">Plus actifs</option>
                <option value="connections">Plus connectés</option>
                <option value="completion">Profils complets</option>
              </select>
            </div>

            <div className="text-sm text-gray-500">
              {filteredMembers().length} membre{filteredMembers().length > 1 ? 's' : ''}
            </div>
          </div>

          {/* Filtres expandables */}
          {showFilters && activeTab === 'discover' && (
            <div className="mt-4 pt-4 border-t space-y-4">
              {/* Région */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Région</h3>
                <select
                  value={filters.region}
                  onChange={(e) => handleFilterChange('region', e.target.value)}
                  className="w-full md:w-auto px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">Toutes les régions</option>
                  {regions.slice(1).map(region => (
                    <option key={region} value={region.toLowerCase()}>
                      {region}
                    </option>
                  ))}
                </select>
              </div>

              {/* Expérience */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Niveau d'expérience</h3>
                <div className="flex flex-wrap gap-2">
                  {experienceLevels.map(level => (
                    <button
                      key={level.value}
                      onClick={() => handleFilterChange('experience', level.value)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        filters.experience === level.value
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {level.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Options supplémentaires */}
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={filters.isMentor}
                    onChange={(e) => handleFilterChange('isMentor', e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">Mentors uniquement</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={filters.isOnline}
                    onChange={(e) => handleFilterChange('isOnline', e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">En ligne maintenant</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={filters.hasPhoto}
                    onChange={(e) => handleFilterChange('hasPhoto', e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">Avec photo</span>
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Contenu principal */}
      {activeTab === 'requests' ? (
        // Liste des demandes de connexion
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Demandes de connexion en attente</h2>
          {requests && requests.length > 0 ? (
            <div className="space-y-4">
              {requests.map(request => (
                <div key={request.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center text-white font-bold">
                      {request.sender.first_name[0]}{request.sender.last_name[0]}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {request.sender.first_name} {request.sender.last_name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {request.sender.current_position} • {request.sender.region}
                      </p>
                      {request.message && (
                        <p className="text-sm text-gray-600 mt-1 italic">
                          "{request.message}"
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleAcceptRequest(request.id)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Check className="w-4 h-4 inline mr-1" />
                      Accepter
                    </button>
                    <button
                      onClick={() => handleRejectRequest(request.id)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <X className="w-4 h-4 inline mr-1" />
                      Refuser
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">
              Aucune demande de connexion en attente
            </p>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <MemberGrid
          members={filteredMembers()}
          onMemberClick={(member) => {
            setSelectedMember(member);
            setShowProfileModal(true);
          }}
          onConnect={handleConnect}
          onMessage={(memberId) => {
            toast.info('Messagerie en cours de développement');
          }}
        />
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Membre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Localisation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expérience
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Connexions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredMembers().map((member) => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center text-white font-bold mr-3">
                        {member.first_name[0]}{member.last_name[0]}
                      </div>
                      <div>
                        <button
                          onClick={() => {
                            setSelectedMember(member);
                            setShowProfileModal(true);
                          }}
                          className="text-sm font-medium text-gray-900 hover:text-indigo-600"
                        >
                          {member.first_name} {member.last_name}
                        </button>
                        <p className="text-xs text-gray-500">
                          {member.current_position}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      {member.ville}, {member.region}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      member.experience === 'nationale' ? 'bg-purple-100 text-purple-700' :
                      member.experience === 'regionale' ? 'bg-blue-100 text-blue-700' :
                      member.experience === 'locale' ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {experienceLevels.find(l => l.value === member.experience)?.label || member.experience}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {member.connections_count}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      {member.is_connected ? (
                        <button
                          onClick={() => toast.info('Messagerie en cours de développement')}
                          className="text-indigo-600 hover:text-indigo-700"
                        >
                          <MessageSquare className="w-5 h-5" />
                        </button>
                      ) : member.has_pending_request ? (
                        <span className="text-sm text-gray-500">
                          En attente
                        </span>
                      ) : (
                        <button
                          onClick={() => handleConnect(member.id)}
                          className="text-indigo-600 hover:text-indigo-700"
                        >
                          <UserPlus className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal profil membre */}
      {showProfileModal && selectedMember && (
        <MemberProfile
          member={selectedMember}
          onClose={() => {
            setShowProfileModal(false);
            setSelectedMember(null);
          }}
          onConnect={() => handleConnect(selectedMember.id)}
          onMessage={() => toast.info('Messagerie en cours de développement')}
        />
      )}

      {/* Modal demande de connexion */}
      {showRequestModal && selectedMember && (
        <ConnectionRequest
          member={selectedMember}
          onClose={() => {
            setShowRequestModal(false);
            setSelectedMember(null);
          }}
          onSend={(message) => handleSendRequest(selectedMember.id, message)}
        />
      )}
    </div>
  );
};

export default Networking;