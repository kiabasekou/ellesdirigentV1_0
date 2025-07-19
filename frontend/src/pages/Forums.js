/**
 * Page Forums - Système de discussion complet
 * Gestion des catégories, fils de discussion, posts et interactions
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MessageSquare, 
  Plus, 
  Search, 
  Filter,
  TrendingUp,
  Users,
  Clock,
  Star,
  ChevronRight,
  Hash,
  Lock,
  Globe,
  Flame,
  Award,
  BookOpen,
  Heart,
  MessageCircle,
  Eye,
  ThumbsUp,
  AlertCircle,
  Loader,
  X
} from 'lucide-react';
import { forumService } from '../services/forumService';
import { useForum } from '../hooks/useForum';
import { toast } from '../components/Toast';
import ForumList from '../components/forums/ForumList';
import ThreadList from '../components/forums/ThreadList';
import ThreadDetail from '../components/forums/ThreadDetail';
import PostEditor from '../components/forums/PostEditor';

const Forums = () => {
  const navigate = useNavigate();
  const { 
    categories, 
    threads, 
    loading, 
    error, 
    fetchCategories, 
    fetchThreads,
    createThread,
    searchThreads 
  } = useForum();

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedThread, setSelectedThread] = useState(null);
  const [showNewThread, setShowNewThread] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [filterBy, setFilterBy] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Catégories de forums prédéfinies
  const defaultCategories = [
    {
      id: 1,
      name: 'Discussions Générales',
      slug: 'general',
      description: 'Échanges libres sur tous les sujets',
      icon: MessageSquare,
      color: 'blue',
      threads_count: 156,
      posts_count: 1842,
      is_public: true
    },
    {
      id: 2,
      name: 'Politique & Gouvernance',
      slug: 'politique',
      description: 'Débats sur les enjeux politiques actuels',
      icon: Globe,
      color: 'purple',
      threads_count: 89,
      posts_count: 723,
      is_public: true
    },
    {
      id: 3,
      name: 'Mentorat & Conseils',
      slug: 'mentorat',
      description: 'Partage d\'expériences et accompagnement',
      icon: Users,
      color: 'green',
      threads_count: 67,
      posts_count: 412,
      is_public: true
    },
    {
      id: 4,
      name: 'Formations & Ressources',
      slug: 'formations',
      description: 'Ressources éducatives et opportunités',
      icon: BookOpen,
      color: 'yellow',
      threads_count: 45,
      posts_count: 234,
      is_public: true
    },
    {
      id: 5,
      name: 'Succès & Témoignages',
      slug: 'succes',
      description: 'Partagez vos réussites et inspirez',
      icon: Award,
      color: 'pink',
      threads_count: 34,
      posts_count: 178,
      is_public: true
    },
    {
      id: 6,
      name: 'Espace Privé',
      slug: 'prive',
      description: 'Discussions réservées aux membres vérifiées',
      icon: Lock,
      color: 'gray',
      threads_count: 23,
      posts_count: 98,
      is_public: false,
      is_private: true
    }
  ];

  // Options de tri
  const sortOptions = [
    { value: 'recent', label: 'Plus récents', icon: Clock },
    { value: 'popular', label: 'Plus populaires', icon: TrendingUp },
    { value: 'active', label: 'Plus actifs', icon: Flame },
    { value: 'unanswered', label: 'Sans réponse', icon: MessageCircle }
  ];

  // Options de filtre
  const filterOptions = [
    { value: 'all', label: 'Tous les sujets' },
    { value: 'my_threads', label: 'Mes sujets' },
    { value: 'following', label: 'Sujets suivis' },
    { value: 'mentoring', label: 'Mentorat' },
    { value: 'resolved', label: 'Résolus' }
  ];

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      await fetchCategories();
    } catch (error) {
      console.error('Erreur chargement catégories:', error);
    }
  };

  const handleCategorySelect = async (category) => {
    setSelectedCategory(category);
    setSelectedThread(null);
    setShowNewThread(false);
    
    try {
      await fetchThreads(category.id, { sort: sortBy, filter: filterBy });
    } catch (error) {
      toast.error('Erreur lors du chargement des discussions');
    }
  };

  const handleThreadSelect = (thread) => {
    setSelectedThread(thread);
    setShowNewThread(false);
  };

  const handleCreateThread = async (threadData) => {
    try {
      const newThread = await createThread({
        ...threadData,
        category_id: selectedCategory.id
      });
      
      toast.success('Discussion créée avec succès');
      setShowNewThread(false);
      setSelectedThread(newThread);
      
      // Recharger les threads
      await fetchThreads(selectedCategory.id);
    } catch (error) {
      toast.error('Erreur lors de la création de la discussion');
    }
  };

  const handleSearch = useCallback(
    debounce(async (term) => {
      if (term.length < 3) return;
      
      try {
        await searchThreads(term);
      } catch (error) {
        console.error('Erreur recherche:', error);
      }
    }, 500),
    []
  );

  const handleSortChange = async (newSort) => {
    setSortBy(newSort);
    if (selectedCategory) {
      await fetchThreads(selectedCategory.id, { sort: newSort, filter: filterBy });
    }
  };

  const handleFilterChange = async (newFilter) => {
    setFilterBy(newFilter);
    if (selectedCategory) {
      await fetchThreads(selectedCategory.id, { sort: sortBy, filter: newFilter });
    }
  };

  // Statistiques globales
  const forumStats = {
    totalThreads: categories.reduce((sum, cat) => sum + (cat.threads_count || 0), 0),
    totalPosts: categories.reduce((sum, cat) => sum + (cat.posts_count || 0), 0),
    activeUsers: 234,
    onlineNow: 45
  };

  if (loading && !categories.length) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* En-tête avec statistiques */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h1 className="text-3xl font-bold mb-4">Forums de Discussion</h1>
            <p className="text-blue-100 mb-6">
              Échangez, partagez et construisez ensemble l'avenir de la participation 
              féminine en politique
            </p>
            
            {/* Barre de recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-200" />
              <input
                type="text"
                placeholder="Rechercher dans les forums..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  handleSearch(e.target.value);
                }}
                className="w-full pl-10 pr-4 py-3 bg-white/20 backdrop-blur-sm rounded-lg placeholder-blue-200 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
              />
            </div>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <MessageSquare className="w-8 h-8 mb-2" />
              <div className="text-2xl font-bold">{forumStats.totalThreads}</div>
              <div className="text-sm text-blue-100">Discussions</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <MessageCircle className="w-8 h-8 mb-2" />
              <div className="text-2xl font-bold">{forumStats.totalPosts}</div>
              <div className="text-sm text-blue-100">Messages</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <Users className="w-8 h-8 mb-2" />
              <div className="text-2xl font-bold">{forumStats.activeUsers}</div>
              <div className="text-sm text-blue-100">Membres actives</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <Globe className="w-8 h-8 mb-2" />
              <div className="text-2xl font-bold">{forumStats.onlineNow}</div>
              <div className="text-sm text-blue-100">En ligne</div>
            </div>
          </div>
        </div>
      </div>

      {/* Layout principal */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar - Catégories */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm p-4 sticky top-4">
            <h2 className="text-lg font-semibold mb-4">Catégories</h2>
            <div className="space-y-2">
              {(categories.length > 0 ? categories : defaultCategories).map((category) => {
                const IconComponent = category.icon || MessageSquare;
                const isSelected = selectedCategory?.id === category.id;
                
                return (
                  <button
                    key={category.id}
                    onClick={() => handleCategorySelect(category)}
                    className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                      isSelected
                        ? 'bg-blue-50 border-2 border-blue-500'
                        : 'hover:bg-gray-50 border-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg bg-${category.color || 'blue'}-100`}>
                          <IconComponent className={`w-5 h-5 text-${category.color || 'blue'}-600`} />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{category.name}</h3>
                          <p className="text-xs text-gray-500">
                            {category.threads_count || 0} discussions
                          </p>
                        </div>
                      </div>
                      {category.is_private && (
                        <Lock className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Bouton nouveau sujet */}
            {selectedCategory && (
              <button
                onClick={() => setShowNewThread(true)}
                className="w-full mt-4 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105"
              >
                <Plus className="w-5 h-5 inline mr-2" />
                Nouveau sujet
              </button>
            )}
          </div>

          {/* Sujets populaires */}
          <div className="bg-white rounded-xl shadow-sm p-4 mt-4">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Flame className="w-5 h-5 text-orange-500 mr-2" />
              Sujets populaires
            </h3>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="text-sm">
                  <div className="flex items-start space-x-2">
                    <Hash className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900 hover:text-blue-600 cursor-pointer">
                        Stratégies de campagne efficaces
                      </p>
                      <p className="text-xs text-gray-500">45 messages</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="lg:col-span-3">
          {!selectedCategory ? (
            // Vue d'accueil
            <div className="bg-white rounded-xl shadow-sm p-8 text-center">
              <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Bienvenue dans les forums
              </h2>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Sélectionnez une catégorie pour voir les discussions ou créez 
                votre propre sujet pour démarrer une conversation
              </p>

              {/* Catégories en grille */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                {(categories.length > 0 ? categories : defaultCategories).slice(0, 4).map((category) => {
                  const IconComponent = category.icon || MessageSquare;
                  
                  return (
                    <button
                      key={category.id}
                      onClick={() => handleCategorySelect(category)}
                      className="p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-lg transition-all group"
                    >
                      <div className={`w-12 h-12 mx-auto mb-3 rounded-xl bg-${category.color || 'blue'}-100 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <IconComponent className={`w-6 h-6 text-${category.color || 'blue'}-600`} />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">{category.name}</h3>
                      <p className="text-sm text-gray-600">{category.description}</p>
                      <div className="mt-3 flex items-center justify-center space-x-4 text-xs text-gray-500">
                        <span>{category.threads_count || 0} sujets</span>
                        <span>•</span>
                        <span>{category.posts_count || 0} messages</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : showNewThread ? (
            // Formulaire nouveau sujet
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Nouveau sujet dans {selectedCategory.name}
                </h2>
                <button
                  onClick={() => setShowNewThread(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <PostEditor
                onSubmit={handleCreateThread}
                onCancel={() => setShowNewThread(false)}
                mode="thread"
                category={selectedCategory}
              />
            </div>
          ) : selectedThread ? (
            // Vue détaillée d'un thread
            <ThreadDetail
              thread={selectedThread}
              onBack={() => setSelectedThread(null)}
              onUpdate={(updatedThread) => setSelectedThread(updatedThread)}
            />
          ) : (
            // Liste des threads
            <div className="space-y-4">
              {/* Barre de filtres */}
              <div className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
                    >
                      <Filter className="w-5 h-5" />
                      <span>Filtres</span>
                    </button>
                    
                    {/* Tri */}
                    <select
                      value={sortBy}
                      onChange={(e) => handleSortChange(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {sortOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="text-sm text-gray-500">
                    {threads.length} discussion{threads.length > 1 ? 's' : ''}
                  </div>
                </div>

                {/* Filtres expandables */}
                {showFilters && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex flex-wrap gap-2">
                      {filterOptions.map(option => (
                        <button
                          key={option.value}
                          onClick={() => handleFilterChange(option.value)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            filterBy === option.value
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Liste des threads */}
              <ThreadList
                threads={threads}
                onThreadSelect={handleThreadSelect}
                loading={loading}
                emptyMessage="Aucune discussion dans cette catégorie. Soyez la première à créer un sujet!"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Fonction utilitaire pour le debounce
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export default Forums;