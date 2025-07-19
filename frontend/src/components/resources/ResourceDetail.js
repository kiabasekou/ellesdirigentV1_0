
import React from 'react';
import { X, Download, Heart, Folder, Eye, Clock, Tag } from 'lucide-react';

const ResourceDetail = ({ 
  resource, 
  onClose, 
  onDownload, 
  onLike, 
  onSave,
  getFileTypeInfo,
  formatFileSize 
}) => {
  const typeInfo = getFileTypeInfo(resource.type);
  const IconComponent = typeInfo.icon;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
        
        <div className="relative bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
            <h2 className="text-xl font-bold">Détails de la ressource</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            <div className={`h-64 bg-gradient-to-br from-${typeInfo.color}-400 to-${typeInfo.color}-600 rounded-lg flex items-center justify-center mb-6`}>
              <IconComponent className="w-32 h-32 text-white opacity-50" />
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold text-gray-900">{resource.title}</h1>
                <span className={`px-4 py-2 bg-${typeInfo.color}-100 text-${typeInfo.color}-700 rounded-full font-medium`}>
                  {typeInfo.label}
                </span>
              </div>

              <p className="text-gray-600 mb-4">{resource.description}</p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Eye className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{resource.views}</p>
                  <p className="text-sm text-gray-500">Vues</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Download className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{resource.download_count}</p>
                  <p className="text-sm text-gray-500">Téléchargements</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Heart className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{resource.likes}</p>
                  <p className="text-sm text-gray-500">J'aime</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Clock className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                  <p className="text-lg font-bold text-gray-900">
                    {new Date(resource.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-500">Ajouté le</p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center text-gray-600">
                  <span className="font-medium mr-2">Auteur:</span>
                  <span>{resource.author}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <span className="font-medium mr-2">Taille:</span>
                  <span>{formatFileSize(resource.file_size)}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <span className="font-medium mr-2">Type:</span>
                  <span>{resource.type.toUpperCase()}</span>
                </div>
              </div>

              {resource.tags && resource.tags.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3 flex items-center">
                    <Tag className="w-5 h-5 mr-2" />
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {resource.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => onDownload(resource)}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Télécharger
                </button>
                <button
                  onClick={() => onLike(resource)}
                  className={`px-6 py-3 rounded-lg transition-colors flex items-center ${
                    resource.is_liked
                      ? 'bg-red-100 text-red-600 hover:bg-red-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Heart className={`w-5 h-5 mr-2 ${resource.is_liked ? 'fill-current' : ''}`} />
                  {resource.is_liked ? 'Aimé' : 'J\'aime'}
                </button>
                <button
                  onClick={() => onSave(resource)}
                  className={`px-6 py-3 rounded-lg transition-colors flex items-center ${
                    resource.is_saved
                      ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Folder className={`w-5 h-5 mr-2 ${resource.is_saved ? 'fill-current' : ''}`} />
                  {resource.is_saved ? 'Sauvegardé' : 'Sauvegarder'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourceDetail;

