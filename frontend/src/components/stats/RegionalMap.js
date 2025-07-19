import React from 'react';
import { MapPin } from 'lucide-react';

const RegionalMap = ({ data }) => {
  // Pour une vraie carte, utilisez react-leaflet ou mapbox
  // Ici, on fait une représentation simple
  
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Répartition régionale</h2>
        <MapPin className="w-5 h-5 text-gray-400" />
      </div>
      
      <div className="space-y-3">
        {data.map((region, index) => (
          <div key={index}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">{region.region}</span>
              <span className="text-sm text-gray-500">{region.percentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${region.percentage}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">{region.count} membres</p>
          </div>
        ))}
      </div>
      
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600 text-center">
          <MapPin className="w-4 h-4 inline mr-1" />
          Total: {data.reduce((sum, r) => sum + r.count, 0)} membres dans {data.length} régions
        </p>
      </div>
    </div>
  );
};

export default RegionalMap;