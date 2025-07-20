import React, { useState } from 'react';
import { Search, Filter, Grid, List, BookOpen, TrendingUp } from 'lucide-react';
import FormationCard from '../../components/training/FormationCard';
import { useFormations } from '../../hooks/useFormations';

const FormationsPage = () => {
  const [filters, setFilters] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);

  const { formations, loading, error, refetch } = useFormations({
    ...filters,
    search: searchTerm
  });

  const categories = [
    { value: '', label: 'Toutes les catégories' },
    { value: 'leadership', label: 'Leadership' },
    { value: 'communication', label: 'Communication' },
    { value: 'campagne', label: 'Campagne électorale' },
    { value: 'gouvernance', label: 'Gouvernance' },
    { value: 'negociation', label: 'Négociation' },
    { value: 'droits_femmes', label: 'Droits des femmes' },
    { value: 'economie', label: 'Économie politique' }
  ];

  const niveaux = [
    { value: '', label: 'Tous les niveaux' },
    { value: 'debutant', label: 'Débutant' },
    { value: 'intermediaire', label: 'Intermédiaire' },
    { value: 'avance', label: 'Avancé' }
  ];

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === '' ? undefined : value
    }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
  };

  const handleInscription = (formationId, inscriptionData) => {
    // Actualiser la liste des formations pour refléter l'inscription
    refetch();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des formations...</p>
        </div>
      </div>
    );
  }

  // Statistiques rapides
  const stats = {
    total: formations.length,
    disponibles: formations.filter(f => !f.est_complete && new Date(f.date_debut) > new Date()).length,
    gratuites: formations.filter(f => f.cout === 0).length,
    certifiantes: formations.filter(f => f.certificat_delivre).length
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header avec statistiques */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
            <div className="mb-4 lg:mb-0">
              <h1 className="text-3xl font-bold text-gray-900">Catalogue de Formations</h1>
              <p className="text-gray-600">Développez vos compétences politiques et votre leadership</p>
            </div>
            
            {/* Barre de recherche */}
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Rechercher une formation..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-80 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Filter className="w-5 h-5" />
                Filtres
              </button>
            </form>
          </div>

          {/* Statistiques rapides */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center">
                <BookOpen className="w-8 h-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-600">Total</p>
                  <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center">
                <TrendingUp className="w-8 h-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-600">Disponibles</p>
                  <p className="text-2xl font-bold text-green-900">{stats.disponibles}</p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="flex items-center">
                <span className="w-8 h-8 bg-yellow-600 rounded-full flex items-center justify-center text-white font-bold">€</span>
                <div className="ml-3">
                  <p className="text-sm font-medium text-yellow-600">Gratuites</p>
                  <p className="text-2xl font-bold text-yellow-900">{stats.gratuites}</p>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center">
                <span className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white">🏆</span>
                <div className="ml-3">
                  <p className="text-sm font-medium text-purple-600">Certifiantes</p>
                  <p className="text-2xl font-bold text-purple-900">{stats.certifiantes}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filtres */}
          {showFilters && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Catégorie
                  </label>
                  <select
                    value={filters.categorie || ''}
                    onChange={(e) => handleFilterChange('categorie', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Niveau
                  </label>
                  <select
                    value={filters.niveau || ''}
                    onChange={(e) => handleFilterChange('niveau', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    {niveaux.map(niveau => (
                      <option key={niveau.value} value={niveau.value}>{niveau.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Format
                  </label>
                  <select
                    value={filters.en_ligne || ''}
                    onChange={(e) => handleFilterChange('en_ligne', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="">Tous les formats</option>
                    <option value="true">En ligne</option>
                    <option value="false">Présentiel</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prix
                  </label>
                  <select
                    value={filters.gratuit || ''}
                    onChange={(e) => handleFilterChange('gratuit', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="">Tous les prix</option>
                    <option value="true">Gratuites uniquement</option>
                    <option value="false">Payantes uniquement</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Contrôles d'affichage */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {formations.length} formation{formations.length > 1 ? 's' : ''} trouvée{formations.length > 1 ? 's' : ''}
            </p>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error ? (
          <div className="text-center py-12">
            <div className="bg-red-50 rounded-lg p-6 inline-block">
              <p className="text-red-600 font-medium">Erreur lors du chargement</p>
              <p className="text-red-500 text-sm mt-1">{error}</p>
              <button 
                onClick={refetch}
                className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                Réessayer
              </button>
            </div>
          </div>
        ) : formations.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune formation trouvée</h3>
            <p className="text-gray-600">
              {searchTerm || Object.values(filters).some(f => f) 
                ? 'Essayez de modifier vos critères de recherche.'
                : 'Les formations seront bientôt disponibles.'
              }
            </p>
          </div>
        ) : (
          <div className={`${
            viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
              : 'space-y-4'
          }`}>
            {formations.map(formation => (
              <FormationCard 
                key={formation.id} 
                formation={formation}
                onInscription={handleInscription}
                viewMode={viewMode}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FormationsPage;