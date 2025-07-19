/**
 * Page Ressources - Bibliothèque de documents et matériel éducatif
 * Téléchargement, partage et gestion des ressources
 */
import React, { useState, useEffect } from 'react';
import { 
  BookOpen,
  FileText,
  Download,
  Upload,
  Search,
  Filter,
  Grid,
  List,
  Star,
  Clock,
  Eye,
  Heart,
  Share2,
  Folder,
  File,
  Video,
  Image,
  FileSpreadsheet,
  Presentation,
  Tag,
  TrendingUp,
  Award,
  ChevronDown,
  Plus,
  Check,
  X,
  Loader,
  AlertCircle
} from 'lucide-react';
import { resourceService } from '../services/resourceService';
import { useResources } from '../hooks/useResources';
import { toast } from '../components/Toast';
import ResourceGrid from '../components/resources/ResourceGrid';
import ResourceCard from '../components/resources/ResourceCard';
import ResourceDetail from '../components/resources/ResourceDetail';
import ResourceUpload from '../components/resources/ResourceUpload';
import ResourceFilters from '../components/resources/ResourceFilters';

const Resources = () => {
  const { 
    resources, 
    categories, 
    loading, 
    error, 
    fetchResources, 
    uploadResource, 
    downloadResource,
    likeResource,
    saveResource 
  } = useResources();

  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [selectedResource, setSelectedResource] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [filterFavorites, setFilterFavorites] = useState(false);
  const [filterDownloaded, setFilterDownloaded] = useState(false);

  // Types de fichiers avec icônes et couleurs
  const fileTypes = {
    pdf: { icon: FileText, color: 'red', label: 'PDF' },
    doc: { icon: FileText, color: 'blue', label: 'Document' },
    docx: { icon: FileText, color: 'blue', label: 'Document' },
    xls: { icon: FileSpreadsheet, color: 'green', label: 'Tableur' },
    xlsx: { icon: FileSpreadsheet, color: 'green', label: 'Tableur' },
    ppt: { icon: Presentation, color: 'orange', label: 'Présentation' },
    pptx: { icon: Presentation, color: 'orange', label: 'Présentation' },
    mp4: { icon: Video, color: 'purple', label: 'Vidéo' },
    jpg: { icon: Image, color: 'pink', label: 'Image' },
    jpeg: { icon: Image, color: 'pink', label: 'Image' },
    png: { icon: Image, color: 'pink', label: 'Image' }
  };

  // Catégories de ressources
  const resourceCategories = [
    { id: 'all', name: 'Toutes les catégories', count: 0 },
    { id: 'guides', name: 'Guides pratiques', icon: BookOpen, count: 45 },
    { id: 'formations', name: 'Supports de formation', icon: Award, count: 32 },
    { id: 'modeles', name: 'Modèles et templates', icon: FileText, count: 28 },
    { id: 'legislation', name: 'Textes législatifs', icon: FileText, count: 19 },
    { id: 'strategies', name: 'Stratégies politiques', icon: TrendingUp, count: 15 },
    { id: 'communication', name: 'Communication', icon: Share2, count: 23 },
    { id: 'videos', name: 'Vidéos éducatives', icon: Video, count: 12 }
  ];

  // Ressources de démonstration
  const demoResources = [
    {
      id: 1,
      title: 'Guide Complet du Leadership Féminin en Politique',
      description: 'Un guide exhaustif pour développer vos compétences de leadership et réussir en politique',
      category: 'guides',
      type: 'pdf',
      file_size: 2457600, // 2.4 MB
      download_count: 342,
      views: 1205,
      likes: 89,
      author: 'Dr. Marie Nguema',
      created_at: new Date('2024-01-10'),
      tags: ['leadership', 'femmes', 'politique', 'guide'],
      is_featured: true,
      is_liked: false,
      is_saved: false,
      thumbnail: null
    },
    {
      id: 2,
      title: 'Modèle de Plan de Campagne Électorale',
      description: 'Template complet pour organiser votre campagne électorale de A à Z',
      category: 'modeles',
      type: 'xlsx',
      file_size: 458752, // 448 KB
      download_count: 128,
      views: 567,
      likes: 45,
      author: 'Campaign Academy',
      created_at: new Date('2024-01-08'),
      tags: ['campagne', 'élections', 'planning', 'template'],
      is_featured: false,
      is_liked: true,
      is_saved: true,
      thumbnail: null
    },
    {
      id: 3,
      title: 'Présentation: Communication Politique Efficace',
      description: 'Slides de formation sur les techniques de communication politique moderne',
      category: 'formations',
      type: 'pptx',
      file_size: 3145728, // 3 MB
      download_count: 234,
      views: 890,
      likes: 67,
      author: 'Jeanne Mbadinga',
      created_at: new Date('2024-01-05'),
      tags: ['communication', 'médias', 'formation', 'présentation'],
      is_featured: true,
      is_liked: false,
      is_saved: false,
      thumbnail: null
    },
    {
      id: 4,
      title: 'Code Électoral du Gabon - Version Annotée',
      description: 'Texte complet du code électoral avec annotations et explications',
      category: 'legislation',
      type: 'pdf',
      file_size: 1572864, // 1.5 MB
      download_count: 456,
      views: 1890,
      likes: 123,
      author: 'Ministère de l\'Intérieur',
      created_at: new Date('2023-12-20'),
      tags: ['loi', 'élections', 'législation', 'référence'],
      is_featured: false,
      is_liked: false,
      is_saved: true,
      thumbnail: null
    }
  ];

  useEffect(() => {
    loadResources();
  }, [selectedCategory, selectedType, sortBy, filterFavorites, filterDownloaded]);

  const loadResources = async () => {
    try {
      const params = {
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        type: selectedType !== 'all' ? selectedType : undefined,
        sort: sortBy,
        favorites: filterFavorites,
        downloaded: filterDownloaded,
        search: searchTerm
      };
      
      await fetchResources(params);
    } catch (error) {
      console.error('Erreur chargement ressources:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadResources();
  };

  const handleDownload = async (resource) => {
    try {
      await downloadResource(resource.id);
      toast.success(`Téléchargement de "${resource.title}" démarré`);
      
      // Incrémenter le compteur localement
      setSelectedResource(prev => 
        prev?.id === resource.id 
          ? { ...prev, download_count: prev.download_count + 1 }
          : prev
      );
    } catch (error) {
      toast.error('Erreur lors du téléchargement');
    }
  };

  const handleLike = async (resource) => {
    try {
      await likeResource(resource.id);
      
      // Mettre à jour localement
      setSelectedResource(prev => 
        prev?.id === resource.id 
          ? { ...prev, is_liked: !prev.is_liked, likes: prev.likes + (prev.is_liked ? -1 : 1) }
          : prev
      );
    } catch (error) {
      toast.error('Erreur lors de l\'ajout aux favoris');
    }
  };

  const handleSave = async (resource) => {
    try {
      await saveResource(resource.id);
      toast.success(
        resource.is_saved 
          ? 'Ressource retirée de votre bibliothèque' 
          : 'Ressource ajoutée à votre bibliothèque'
      );
      
      // Mettre à jour localement
      setSelectedResource(prev => 
        prev?.id === resource.id 
          ? { ...prev, is_saved: !prev.is_saved }
          : prev
      );
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  const handleUpload = async (formData) => {
    try {
      await uploadResource(formData);
      toast.success('Ressource téléchargée avec succès');
      setShowUploadModal(false);
      loadResources();
    } catch (error) {
      toast.error('Erreur lors du téléchargement');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileTypeInfo = (type) => {
    return fileTypes[type] || { icon: File, color: 'gray', label: 'Fichier' };
  };

  const filteredResources = () => {
    let data = resources.length > 0 ? resources : demoResources;
    
    // Filtre par recherche
    if (searchTerm) {
      data = data.filter(resource =>
        resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resource.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Filtre par catégorie
    if (selectedCategory !== 'all') {
      data = data.filter(resource => resource.category === selectedCategory);
    }
    
    // Filtre par type
    if (selectedType !== 'all') {
      data = data.filter(resource => resource.type === selectedType);
    }
    
    // Filtre favoris
    if (filterFavorites) {
      data = data.filter(resource => resource.is_liked);
    }
    
    // Filtre téléchargés
    if (filterDownloaded) {
      data = data.filter(resource => resource.is_downloaded);
    }
    
    // Tri
    switch (sortBy) {
      case 'popular':
        data = [...data].sort((a, b) => b.download_count - a.download_count);
        break;
      case 'recent':
        data = [...data].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
      case 'alphabetical':
        data = [...data].sort((a, b) => a.title.localeCompare(b.title));
        break;
      default:
        break;
    }
    
    return data;
  };

  const stats = {
    totalResources: filteredResources().length,
    totalDownloads: filteredResources().reduce((sum, r) => sum + r.download_count, 0),
    featuredCount: filteredResources().filter(r => r.is_featured).length,
    savedCount: filteredResources().filter(r => r.is_saved).length
  };

  if (loading && !resources.length) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* En-tête */}
      <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-2xl p-8 text-white mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h1 className="text-3xl font-bold mb-4">Centre de Ressources</h1>
            <p className="text-green-100 mb-6">
              Accédez à une bibliothèque complète de documents, guides et supports 
              pour votre parcours politique
            </p>

            {/* Barre de recherche */}
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-200" />
              <input
                type="text"
                placeholder="Rechercher des ressources..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/20 backdrop-blur-sm rounded-lg placeholder-green-200 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
              />
            </form>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <BookOpen className="w-8 h-8 mb-2" />
              <div className="text-2xl font-bold">{stats.totalResources}</div>
              <div className="text-sm text-green-100">Ressources</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <Download className="w-8 h-8 mb-2" />
              <div className="text-2xl font-bold">{stats.totalDownloads}</div>
              <div className="text-sm text-green-100">Téléchargements</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <Star className="w-8 h-8 mb-2" />
              <div className="text-2xl font-bold">{stats.featuredCount}</div>
              <div className="text-sm text-green-100">Recommandées</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <Heart className="w-8 h-8 mb-2" />
              <div className="text-2xl font-bold">{stats.savedCount}</div>
              <div className="text-sm text-green-100">Sauvegardées</div>
            </div>
          </div>
        </div>
      </div>

      {/* Contrôles et filtres */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
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
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Filter className="w-4 h-4" />
              <span>Filtres</span>
              {(selectedCategory !== 'all' || selectedType !== 'all' || filterFavorites || filterDownloaded) && (
                <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs">
                  Actifs
                </span>
              )}
            </button>

            {/* Tri */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="recent">Plus récents</option>
              <option value="popular">Plus populaires</option>
              <option value="alphabetical">Alphabétique</option>
            </select>
          </div>

          {/* Bouton upload */}
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg hover:from-green-700 hover:to-teal-700 transition-all transform hover:scale-105"
          >
            <Upload className="w-5 h-5 inline mr-2" />
            Partager une ressource
          </button>
        </div>

        {/* Filtres expandables */}
        {showFilters && (
          <ResourceFilters
            categories={resourceCategories}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            selectedType={selectedType}
            onTypeChange={setSelectedType}
            filterFavorites={filterFavorites}
            onFavoritesChange={setFilterFavorites}
            filterDownloaded={filterDownloaded}
            onDownloadedChange={setFilterDownloaded}
            fileTypes={Object.entries(fileTypes).map(([key, value]) => ({
              id: key,
              ...value
            }))}
          />
        )}
      </div>

      {/* Contenu principal */}
      {viewMode === 'grid' ? (
        <ResourceGrid
          resources={filteredResources()}
          onResourceClick={setSelectedResource}
          onDownload={handleDownload}
          onLike={handleLike}
          onSave={handleSave}
          getFileTypeInfo={getFileTypeInfo}
          formatFileSize={formatFileSize}
        />
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ressource
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Catégorie
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Taille
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Téléchargements
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredResources().map((resource) => {
                const typeInfo = getFileTypeInfo(resource.type);
                const IconComponent = typeInfo.icon;
                
                return (
                  <tr key={resource.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className={`p-2 rounded-lg bg-${typeInfo.color}-100 mr-4`}>
                          <IconComponent className={`w-5 h-5 text-${typeInfo.color}-600`} />
                        </div>
                        <div>
                          <button
                            onClick={() => setSelectedResource(resource)}
                            className="text-sm font-medium text-gray-900 hover:text-green-600"
                          >
                            {resource.title}
                          </button>
                          <p className="text-xs text-gray-500 mt-1">
                            Par {resource.author}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                        {resourceCategories.find(c => c.id === resource.category)?.name || resource.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatFileSize(resource.file_size)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {resource.download_count}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleDownload(resource)}
                          className="p-1.5 text-gray-400 hover:text-green-600 transition-colors"
                          title="Télécharger"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleLike(resource)}
                          className={`p-1.5 transition-colors ${
                            resource.is_liked
                              ? 'text-red-500 hover:text-red-600'
                              : 'text-gray-400 hover:text-red-500'
                          }`}
                          title="Ajouter aux favoris"
                        >
                          <Heart className={`w-4 h-4 ${resource.is_liked ? 'fill-current' : ''}`} />
                        </button>
                        <button
                          onClick={() => handleSave(resource)}
                          className={`p-1.5 transition-colors ${
                            resource.is_saved
                              ? 'text-blue-500 hover:text-blue-600'
                              : 'text-gray-400 hover:text-blue-500'
                          }`}
                          title="Sauvegarder"
                        >
                          <Folder className={`w-4 h-4 ${resource.is_saved ? 'fill-current' : ''}`} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal détail ressource */}
      {selectedResource && (
        <ResourceDetail
          resource={selectedResource}
          onClose={() => setSelectedResource(null)}
          onDownload={handleDownload}
          onLike={handleLike}
          onSave={handleSave}
          getFileTypeInfo={getFileTypeInfo}
          formatFileSize={formatFileSize}
        />
      )}

      {/* Modal upload */}
      {showUploadModal && (
        <ResourceUpload
          onClose={() => setShowUploadModal(false)}
          onUpload={handleUpload}
          categories={resourceCategories}
        />
      )}
    </div>
  );
};

export default Resources;