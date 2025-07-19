import React from 'react';
import { MapPin, Briefcase, Shield, UserPlus, MessageSquare, Circle } from 'lucide-react';

const MemberCard = ({ member, onClick, onConnect, onMessage }) => {
  return (
    <div
      className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
      onClick={onClick}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center text-white font-bold text-lg">
                {member.first_name?.[0]}{member.last_name?.[0]}
              </div>
              {member.is_online && (
                <Circle className="absolute bottom-0 right-0 w-4 h-4 text-green-500 fill-current" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 flex items-center">
                {member.first_name} {member.last_name}
                {member.is_mentor && (
                  <Shield className="w-4 h-4 text-purple-600 ml-2" title="Mentor" />
                )}
              </h3>
              <p className="text-sm text-gray-500">@{member.username}</p>
            </div>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          {member.current_position && (
            <div className="flex items-center text-sm text-gray-600">
              <Briefcase className="w-4 h-4 mr-2" />
              <span className="truncate">{member.current_position}</span>
            </div>
          )}
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="w-4 h-4 mr-2" />
            <span>{member.ville}, {member.region}</span>
          </div>
        </div>

        {member.bio && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">{member.bio}</p>
        )}

        {member.skills && member.skills.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {member.skills.slice(0, 3).map((skill, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
              >
                {skill}
              </span>
            ))}
            {member.skills.length > 3 && (
              <span className="px-2 py-1 text-gray-500 text-xs">
                +{member.skills.length - 3}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t">
          <span className="text-sm text-gray-500">
            {member.connections_count} connexions
          </span>
          <div className="flex items-center space-x-2">
            {member.is_connected ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMessage();
                }}
                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                title="Envoyer un message"
              >
                <MessageSquare className="w-5 h-5" />
              </button>
            ) : member.has_pending_request ? (
              <span className="text-sm text-gray-500 px-3 py-1 bg-gray-100 rounded-full">
                En attente
              </span>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onConnect();
                }}
                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                title="Se connecter"
              >
                <UserPlus className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberCard;