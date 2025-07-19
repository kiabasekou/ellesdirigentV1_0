
import React from 'react';
import { Download, Heart, Folder, Eye, Star } from 'lucide-react';

const ResourceCard = ({ 
  resource, 
  onClick, 
  onDownload, 
  onLike, 
  onSave,
  getFileTypeInfo,
  formatFileSize 
}) => {
  const typeInfo = getFileTypeInfo(resource.type);
  const IconComponent = typeInfo.icon;

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-all cursor-pointer overflow-hidden"
    >
      <div className={`h-48 bg-gradient-to-br from-${typeInfo.color}-400 to-${typeInfo.color}-600 flex items-center justify-center relative`}>
        <IconComponent className="w-20 h-20 text-white opacity-50" />
        {resource.is_featured && (
          <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-medium flex items-center">
            <Star className="w-3 h-3 mr-1" />
            Recommandé
          </div>
        )}
      </div>

      <div className="p-6">
        <div className="flex items-center justify-between mb-2">
          <span className={`px-3 py-1 bg-${typeInfo.color}-100 text-${typeInfo.color}-700 text-xs rounded-full font-medium`}>
            {typeInfo.label}
          </span>
          <span className="text-xs text-gray-500">{formatFileSize(resource.file_size)}</span>
        </div>

        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {resource.title}
        </h3>

        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {resource.description}
        </p>

        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <span>Par {resource.author}</span>
          <span>{new Date(resource.created_at).toLocaleDateString()}</span>
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span className="flex items-center">
              <Eye className="w-4 h-4 mr-1" />
              {resource.views}
            </span>
            <span className="flex items-center">
              <Download className="w-4 h-4 mr-1" />
              {resource.download_count}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onDownload}
              className="p-2 text-gray-400 hover:text-green-600 transition-colors"
              title="Télécharger"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={onLike}
              className={`p-2 transition-colors ${
                resource.is_liked
                  ? 'text-red-500 hover:text-red-600'
                  : 'text-gray-400 hover:text-red-500'
              }`}
              title="Aimer"
            >
              <Heart className={`w-5 h-5 ${resource.is_liked ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={onSave}
              className={`p-2 transition-colors ${
                resource.is_saved
                  ? 'text-blue-500 hover:text-blue-600'
                  : 'text-gray-400 hover:text-blue-500'
              }`}
              title="Sauvegarder"
            >
              <Folder className={`w-5 h-5 ${resource.is_saved ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourceCard;

