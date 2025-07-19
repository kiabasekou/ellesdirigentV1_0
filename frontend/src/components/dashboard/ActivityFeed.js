// src/components/dashboard/ActivityFeed.js
import React from 'react';
import { 
  ChatBubbleLeftRightIcon, 
  CalendarDaysIcon, 
  DocumentTextIcon,
  UsersIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const activities = [
  {
    id: 1,
    type: 'forum',
    title: 'Nouveau message dans "Gouvernance Locale"',
    description: 'Betty Nzoghe a répondu à votre discussion sur les défis de représentativité',
    timestamp: '2025-05-26T10:30:00',
    user: 'Betty Nzoghe'
  },
  {
    id: 2,
    type: 'event',
    title: 'Rappel : Formation Leadership demain',
    description: 'N\'oubliez pas votre participation à la formation "Leadership Féminin en Action"',
    timestamp: '2025-05-26T09:15:00'
  },
  {
    id: 3,
    type: 'resource',
    title: 'Nouvelle ressource disponible',
    description: 'Guide de préparation aux campagnes électorales - ajouté par l\'équipe',
    timestamp: '2025-05-25T16:45:00'
  },
  {
    id: 4,
    type: 'networking',
    title: 'Nouvelle connexion',
    description: 'Cécile Obame souhaite se connecter avec vous',
    timestamp: '2025-05-25T14:20:00',
    user: 'Cécile Obame'
  }
];

const getActivityIcon = (type) => {
  switch (type) {
    case 'forum': return ChatBubbleLeftRightIcon;
    case 'event': return CalendarDaysIcon;
    case 'resource': return DocumentTextIcon;
    case 'networking': return UsersIcon;
    default: return ClockIcon;
  }
};

const getActivityColor = (type) => {
  switch (type) {
    case 'forum': return 'text-blue-600 bg-blue-100';
    case 'event': return 'text-green-600 bg-green-100';
    case 'resource': return 'text-purple-600 bg-purple-100';
    case 'networking': return 'text-pink-600 bg-pink-100';
    default: return 'text-gray-600 bg-gray-100';
  }
};

const ActivityFeed = () => {
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'À l\'instant';
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Activités récentes</h3>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = getActivityIcon(activity.type);
            const colorClass = getActivityColor(activity.type);
            
            return (
              <div key={activity.id} className="flex space-x-3">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${colorClass}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                  <p className="text-sm text-gray-500 mt-1">{activity.description}</p>
                  <p className="text-xs text-gray-400 mt-1">{formatTimestamp(activity.timestamp)}</p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-6">
          <button className="w-full text-sm text-primary-600 hover:text-primary-700 font-medium">
            Voir toutes les activités
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActivityFeed;