
import React from 'react';
import ResourceCard from './ResourceCard';

const ResourceGrid = ({ 
  resources, 
  onResourceClick, 
  onDownload, 
  onLike, 
  onSave,
  getFileTypeInfo,
  formatFileSize 
}) => {
  if (!resources.length) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Aucune ressource trouvée</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {resources.map((resource) => (
        <ResourceCard
          key={resource.id}
          resource={resource}
          onClick={() => onResourceClick(resource)}
          onDownload={(e) => {
            e.stopPropagation();
            onDownload(resource);
          }}
          onLike={(e) => {
            e.stopPropagation();
            onLike(resource);
          }}
          onSave={(e) => {
            e.stopPropagation();
            onSave(resource);
          }}
          getFileTypeInfo={getFileTypeInfo}
          formatFileSize={formatFileSize}
        />
      ))}
    </div>
  );
};

export default ResourceGrid;
