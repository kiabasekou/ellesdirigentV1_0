import React from 'react';
import { 
  X, 
  MapPin, 
  Briefcase, 
  Shield, 
  Calendar, 
  Award, 
  Globe, 
  Link, 
  Twitter,
  Linkedin,
  MessageSquare,
  UserPlus
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const MemberProfile = ({ member, onClose, onConnect, onMessage }) => {
  if (!member) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
        
        <div className="relative bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
            <h2 className="text-xl font-bold">Profil du membre</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Contenu */}
          <div className="p-6">
            {/* Info principale */}
            <div className="flex items-start space-x-6 mb-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center text-white font-bold text-2xl">
                {member.first_name?.[0]}{member.last_name?.[0]}
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                  {member.first_name} {member.last_name}
                  {member.is_mentor && (
                    <Shield className="w-6 h-6 text-purple-600 ml-2" title="Mentor" />
                  )}
                </h1>
                <p className="text-gray-500 mb-2">@{member.username}</p>
                
                {member.current_position && (
                  <div className="flex items-center text-gray-600 mb-1">
                    <Briefcase className="w-5 h-5 mr-2" />
                    <span>{member.current_position}</span>
                    {member.organization && (
                      <span className="ml-1">• {member.organization}</span>
                    )}
                  </div>
                )}
                
                <div className="flex items-center text-gray-600">
                  <MapPin className="w-5 h-5 mr-2" />
                  <span>{member.ville}, {member.region}</span>
                </div>
              </div>
            </div>

            {/* Statistiques */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">
                  {member.connections_count || 0}
                </div>
                <div className="text-sm text-gray-500">Connexions</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">
                  {member.experience === 'nationale' ? 'National' :
                   member.experience === 'regionale' ? 'Régional' :
                   member.experience === 'locale' ? 'Local' : 'Débutante'}
                </div>
                <div className="text-sm text-gray-500">Niveau</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">
                  {member.profile_completion || 0}%
                </div>
                <div className="text-sm text-gray-500">Profil complété</div>
              </div>
            </div>

            {/* Bio */}
            {member.bio && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">À propos</h3>
                <p className="text-gray-600">{member.bio}</p>
              </div>
            )}

            {/* Compétences */}
            {member.skills && member.skills.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Compétences</h3>
                <div className="flex flex-wrap gap-2">
                  {member.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Intérêts politiques */}
            {member.political_interests && member.political_interests.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Intérêts politiques</h3>
                <div className="flex flex-wrap gap-2">
                  {member.political_interests.map((interest, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Langues */}
            {member.languages && member.languages.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Langues</h3>
                <div className="flex flex-wrap gap-2">
                  {member.languages.map((language, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                    >
                      {language}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Liens sociaux */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">Liens</h3>
              <div className="space-y-2">
                {member.website && (
                  <a
                    href={member.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-indigo-600 hover:text-indigo-700"
                  >
                    <Globe className="w-4 h-4 mr-2" />
                    Site web
                  </a>
                )}
                {member.linkedin && (
                  <a
                    href={member.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-indigo-600 hover:text-indigo-700"
                  >
                    <Linkedin className="w-4 h-4 mr-2" />
                    LinkedIn
                  </a>
                )}
                {member.twitter && (
                  <a
                    href={`https://twitter.com/${member.twitter}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-indigo-600 hover:text-indigo-700"
                  >
                    <Twitter className="w-4 h-4 mr-2" />
                    @{member.twitter}
                  </a>
                )}
              </div>
            </div>

            {/* Membre depuis */}
            <div className="text-sm text-gray-500 mb-6">
              <Calendar className="w-4 h-4 inline mr-2" />
              Membre depuis {format(new Date(member.date_joined || new Date()), 'MMMM yyyy', { locale: fr })}
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-3">
              {member.is_connected ? (
                <button
                  onClick={onMessage}
                  className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center"
                >
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Envoyer un message
                </button>
              ) : member.has_pending_request ? (
                <button
                  disabled
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-500 rounded-lg cursor-not-allowed flex items-center justify-center"
                >
                  Demande en attente
                </button>
              ) : (
                <button
                  onClick={onConnect}
                  className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center"
                >
                  <UserPlus className="w-5 h-5 mr-2" />
                  Se connecter
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberProfile;