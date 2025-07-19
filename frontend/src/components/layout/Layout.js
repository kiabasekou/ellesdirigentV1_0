import React, { useState } from 'react';
import { 
  Home,
  User,
  MessageSquare,
  Calendar,
  BookOpen,
  Users,
  BarChart3,
  Settings,
  Menu,
  X,
  Bell,
  Search,
  LogOut,
  Shield
} from 'lucide-react';

const Layout = ({ children, currentUser = {}, onLogout, onNavigate, currentPage }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Valeurs par défaut pour currentUser
  const user = {
    name: currentUser.name || 'Utilisateur',
    isVerified: currentUser.isVerified || false,
    ...currentUser
  };

  const navigation = [
    { id: 'dashboard', name: 'Tableau de bord', icon: Home },
    { id: 'profile', name: 'Mon Profil', icon: User },
    { id: 'forums', name: 'Forums', icon: MessageSquare },
    { id: 'events', name: 'Événements', icon: Calendar },
    { id: 'resources', name: 'Ressources', icon: BookOpen },
    { id: 'networking', name: 'Réseautage', icon: Users },
    { id: 'stats', name: 'Statistiques', icon: BarChart3 },
  ];

  const notifications = [
    {
      id: 1,
      title: 'Nouveau message dans "Gouvernance Locale"',
      description: 'Betty Nzoghe a répondu à votre discussion',
      time: '2h',
      type: 'forum',
      unread: true
    },
    {
      id: 2,
      title: 'Rappel : Formation Leadership demain',
      description: 'N\'oubliez pas votre participation à 14h00',
      time: '5h',
      type: 'event',
      unread: true
    },
    {
      id: 3,
      title: 'Nouvelle connexion',
      description: 'Cécile Obame souhaite se connecter',
      time: '1j',
      type: 'connection',
      unread: false
    }
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  const handleNavClick = (pageId) => {
    if (onNavigate) {
      onNavigate(pageId);
    }
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
        <div className="flex items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              <Menu className="w-6 h-6" />
            </button>
            
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">MF</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-semibold text-gray-900">
                  Plateforme Femmes en Politique
                </h1>
                <p className="text-xs text-gray-500">
                  Ministère de la Femme, de la Famille et de la Protection de l'Enfance
                </p>
              </div>
            </div>
          </div>

          <div className="hidden md:flex flex-1 max-w-lg mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-lg relative"
              >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.map((notification) => (
                      <div key={notification.id} className={`p-4 border-b border-gray-100 hover:bg-gray-50 ${notification.unread ? 'bg-blue-50' : ''}`}>
                        <div className="flex items-start space-x-3">
                          <div className={`w-2 h-2 rounded-full mt-2 ${notification.unread ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                            <p className="text-sm text-gray-600">{notification.description}</p>
                            <p className="text-xs text-gray-400 mt-1">Il y a {notification.time}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-4">
                    <button className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium">
                      Voir toutes les notifications
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900 flex items-center space-x-1">
                  <span>{user.name}</span>
                  {user.isVerified && <Shield className="w-4 h-4 text-green-500" />}
                </p>
                <p className="text-xs text-gray-500">Membre vérifiée</p>
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <button
                onClick={onLogout || (() => {})}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-100 rounded-lg transition-colors"
                title="Se déconnecter"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Desktop */}
        <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:pt-16">
          <div className="flex flex-col flex-grow bg-white border-r border-gray-200 pt-5 pb-4 overflow-y-auto">
            <nav className="flex-1 px-4 space-y-2">
              {navigation.map((item) => {
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 w-full text-left ${
                      currentPage === item.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <IconComponent className="mr-3 h-5 w-5 flex-shrink-0" />
                    {item.name}
                  </button>
                );
              })}
            </nav>

            <div className="px-4 pb-4">
              <button
                onClick={() => handleNavClick('settings')}
                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 w-full text-left ${
                  currentPage === 'settings'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Settings className="mr-3 h-5 w-5 flex-shrink-0" />
                Paramètres
              </button>
            </div>

            <div className="px-4 pb-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-900">
                  Besoin d'aide ?
                </h3>
                <p className="text-xs text-blue-700 mt-1">
                  Consultez notre guide d'utilisation.
                </p>
                <button className="mt-3 w-full bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Aide & Support
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Mobile */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)} />
            <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg z-50">
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex-1 px-4 py-4 space-y-2">
                {navigation.map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 w-full text-left ${
                        currentPage === item.id
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <IconComponent className="mr-3 h-5 w-5 flex-shrink-0" />
                      {item.name}
                    </button>
                  );
                })}
                <button
                  onClick={() => handleNavClick('settings')}
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 w-full text-left ${
                    currentPage === 'settings'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Settings className="mr-3 h-5 w-5 flex-shrink-0" />
                  Paramètres
                </button>
              </nav>
            </div>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 lg:ml-64">
          <div className="p-6">
            {/* Overlay pour fermer les notifications */}
            {notificationsOpen && (
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setNotificationsOpen(false)}
              />
            )}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;