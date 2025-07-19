import React from 'react';
import { 
  PlusIcon,
  PencilIcon,
  CalendarDaysIcon,
  DocumentArrowUpIcon,
  UserPlusIcon,
  ChatBubbleBottomCenterTextIcon
} from '@heroicons/react/24/outline';

const quickActions = [
  {
    name: 'Créer une discussion',
    description: 'Lancez un nouveau sujet dans les forums',
    icon: ChatBubbleBottomCenterTextIcon,
    color: 'bg-blue-500',
    href: '/dashboard/forums/new'
  },
  {
    name: 'Compléter mon profil',
    description: 'Ajoutez plus d\'informations à votre profil',
    icon: PencilIcon,
    color: 'bg-green-500',
    href: '/dashboard/profile/edit'
  },
  {
    name: 'S\'inscrire à un événement',
    description: 'Découvrez les prochaines formations',
    icon: CalendarDaysIcon,
    color: 'bg-purple-500',
    href: '/dashboard/events'
  },
  {
    name: 'Partager une ressource',
    description: 'Contribuez à la bibliothèque commune',
    icon: DocumentArrowUpIcon,
    color: 'bg-orange-500',
    href: '/dashboard/resources/upload'
  },
  {
    name: 'Inviter une amie',
    description: 'Partagez la plateforme avec d\'autres femmes',
    icon: UserPlusIcon,
    color: 'bg-pink-500',
    href: '/dashboard/invite'
  },
  {
    name: 'Organiser un événement',
    description: 'Proposez une formation ou un atelier',
    icon: PlusIcon,
    color: 'bg-indigo-500',
    href: '/events/create'
  }
];

const QuickActions = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Actions rapides</h3>
        <p className="text-sm text-gray-500 mt-1">Que souhaitez-vous faire aujourd\'hui ?</p>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.name}
                className="flex items-start space-x-3 p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all duration-200 text-left group"
              >
                <div className={`flex-shrink-0 w-10 h-10 ${action.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 group-hover:text-primary-700">
                    {action.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {action.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default QuickActions;