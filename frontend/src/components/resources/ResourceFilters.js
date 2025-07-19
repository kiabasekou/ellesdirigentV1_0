
import React from 'react';
import { Filter } from 'lucide-react';

const ResourceFilters = ({
  categories,
  selectedCategory,
  onCategoryChange,
  selectedType,
  onTypeChange,
  filterFavorites,
  onFavoritesChange,
  filterDownloaded,
  onDownloadedChange,
  fileTypes
}) => {
  return (
    <div className="mt-4 pt-4 border-t space-y-4">
      {/* Catégories */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">Catégorie</h3>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === category.id
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.name}
              {category.count > 0 && (
                <span className="ml-1 text-xs">({category.count})</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Types de fichiers */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">Type de fichier</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onTypeChange('all')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedType === 'all'
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Tous
          </button>
          {fileTypes.map((type) => {
            const IconComponent = type.icon;
            return (
              <button
                key={type.id}
                onClick={() => onTypeChange(type.id)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center ${
                  selectedType === type.id
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <IconComponent className="w-4 h-4 mr-1" />
                {type.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filtres supplémentaires */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">Filtres</h3>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={filterFavorites}
              onChange={(e) => onFavoritesChange(e.target.checked)}
              className="rounded text-green-600 focus:ring-green-500 mr-2"
            />
            <span className="text-sm text-gray-700">Mes favoris uniquement</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={filterDownloaded}
              onChange={(e) => onDownloadedChange(e.target.checked)}
              className="rounded text-green-600 focus:ring-green-500 mr-2"
            />
            <span className="text-sm text-gray-700">Déjà téléchargées</span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default ResourceFilters;