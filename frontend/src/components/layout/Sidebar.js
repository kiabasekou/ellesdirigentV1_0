import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  HomeIcon,
  UserIcon,
  ChatBubbleLeftRightIcon,
  CalendarDaysIcon,
  BookOpenIcon,
  UsersIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Tableau de bord', href: '/dashboard', icon: HomeIcon },
  { name: 'Mon Profil', href: '/dashboard/profile', icon: UserIcon },
  { name: 'Forums', href: '/dashboard/forums', icon: ChatBubbleLeftRightIcon },
  { name: 'Événements', href: '/dashboard/events', icon: CalendarDaysIcon },
  { name: 'Ressources', href: '/dashboard/resources', icon: BookOpenIcon },
  { name: 'Réseautage', href: '/dashboard/networking', icon: UsersIcon },
  { name: 'Statistiques', href: '/dashboard/stats', icon: ChartBarIcon },
];

const Sidebar = ({ isOpen, onClose }) => {
  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          <nav className="flex-1 px-4 py-6 space-y-2">
            <div className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={({ isActive }) => 
                      `group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                        isActive
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }`
                    }
                    onClick={() => window.innerWidth < 1024 && onClose()}
                  >
                    <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                    {item.name}
                  </NavLink>
                );
              })}
            </div>
          </nav>

          <div className="p-4 border-t border-gray-200">
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-900">
                Besoin d'aide ?
              </h3>
              <p className="text-xs text-blue-700 mt-1">
                Consultez notre guide.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;