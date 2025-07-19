import React from 'react';
import { Camera, Edit3, Shield, TrendingUp } from 'lucide-react';

const ProfileHeader = ({ 
  profile, 
  avatarPreview, 
  isEditing, 
  onEditToggle, 
  onAvatarChange,
  completionPercentage 
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
        {/* Avatar */}
        <div className="relative">
          <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white">
            {avatarPreview || profile?.avatar ? (
              <img
                src={avatarPreview || profile.avatar}
                alt={profile?.nom_complet}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-3xl font-bold">
                {profile?.first_name?.[0]}{profile?.last_name?.[0]}
              </span>
            )}
          </div>
          {isEditing && (
            <label className="absolute bottom-0 right-0 p-2 bg-blue-600 rounded-full text-white hover:bg-blue-700 cursor-pointer transition-colors">
              <Camera className="w-5 h-5" />
              <input
                type="file"
                accept="image/*"
                onChange={onAvatarChange}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* Informations */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-gray-900">
              {profile?.nom_complet}
            </h1>
            {profile?.is_validated && (
              <Shield className="w-6 h-6 text-green-500" title="Compte vérifié" />
            )}
            {profile?.is_mentor && (
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                Mentor
              </span>
            )}
          </div>
          
          <p className="text-gray-600 mb-4">
            {profile?.current_position} {profile?.organization && `• ${profile.organization}`}
          </p>

          {/* Barre de progression */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-600">Profil complété</span>
              <span className="font-medium">{completionPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Bouton édition */}
        {!isEditing && (
          <button
            onClick={onEditToggle}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <Edit3 className="w-4 h-4" />
            Modifier
          </button>
        )}
      </div>
    </div>
  );
};

export default ProfileHeader;