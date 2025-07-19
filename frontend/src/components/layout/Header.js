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
  Shield,
  Crown,
  Star,
  ChevronDown
} from 'lucide-react';

const PremiumHeader = ({ currentUser = {}, onLogout, onNavigate, currentPage }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Valeurs par défaut pour currentUser
  const user = {
    name: currentUser.name || 'Aline Mengue',
    isVerified: currentUser.isVerified || true,
    role: currentUser.role || 'Présidente d\'ONG',
    avatar: currentUser.avatar || null,
    ...currentUser
  };

  const navigation = [
    { id: 'dashboard', name: 'Tableau de bord', icon: Home, description: 'Vue d\'ensemble' },
    { id: 'profile', name: 'Mon Profil', icon: User, description: 'Informations personnelles' },
    { id: 'forums', name: 'Forums', icon: MessageSquare, description: 'Discussions communautaires' },
    { id: 'events', name: 'Événements', icon: Calendar, description: 'Formations & Ateliers' },
    { id: 'resources', name: 'Ressources', icon: BookOpen, description: 'Bibliothèque documentaire' },
    { id: 'networking', name: 'Réseautage', icon: Users, description: 'Connexions professionnelles' },
    { id: 'stats', name: 'Statistiques', icon: BarChart3, description: 'Analyses et métriques' },
  ];

  const notifications = [
    {
      id: 1,
      title: 'Nouveau message dans "Gouvernance Locale"',
      description: 'Betty Nzoghe a répondu à votre discussion',
      time: '2h',
      type: 'forum',
      unread: true,
      priority: 'high'
    },
    {
      id: 2,
      title: 'Formation Leadership demain',
      description: 'Rappel : Formation à 14h00 au Centre Féminin',
      time: '5h',
      type: 'event',
      unread: true,
      priority: 'medium'
    },
    {
      id: 3,
      title: 'Nouvelle connexion',
      description: 'Cécile Obame souhaite se connecter avec vous',
      time: '1j',
      type: 'connection',
      unread: false,
      priority: 'low'
    }
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  const handleNavClick = (pageId) => {
    if (onNavigate) {
      onNavigate(pageId);
    }
    setSidebarOpen(false);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  };

  return (
    <>
      {/* Header Principal */}
      <header className="bg-white shadow-lg border-b-4 border-gradient-to-r from-green-500 via-yellow-500 to-blue-500 sticky top-0 z-40">
        {/* Bande couleurs nationales */}
        <div className="h-1 bg-gradient-to-r from-green-500 via-yellow-500 to-blue-500"></div>
        
        <div className="px-4 sm:px-6 lg:px-8">
          {/* Top Bar - Informations officielles */}
          <div className="flex items-center justify-between py-2 text-xs border-b border-gray-100">
            <div className="flex items-center space-x-4 text-gray-600">
              <span className="flex items-center space-x-1">
                <div className="w-4 h-3 bg-gradient-to-r from-green-500 via-yellow-500 to-blue-500 rounded-sm"></div>
                <span>République Gabonaise</span>
              </div>
              <span className="hidden sm:block">•</span>
              <span className="hidden sm:block">Unité • Travail • Progrès</span>
            </div>
            <div className="flex items-center space-x-4 text-gray-600">
              <span className="hidden md:block">🕐 Libreville, Gabon</span>
              <span className="hidden md:block">•</span>
              <span className="hidden md:block">Version 2.0</span>
            </div>
          </div>

          {/* Main Header */}
          <div className="flex items-center justify-between py-4">
            {/* Logo et Titre */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all duration-200"
              >
                <Menu className="w-6 h-6" />
              </button>
              
              <div className="flex items-center space-x-4">
                {/* Logo Premium */}
                <div className="relative">
                  <div className="w-14 h-14 bg-gradient-to-br from-green-600 via-yellow-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-xl">MF</span>
                  </div>
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
                    <Crown className="w-3 h-3 text-yellow-800" />
                  </div>
                </div>
                
                <div className="hidden sm:block">
                  <h1 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                    Plateforme Femmes en Politique
                  </h1>
                  <p className="text-sm text-gray-600 font-medium">
                    Ministère de la Femme, de la Famille et de la Protection de l'Enfance
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    </div>
                    <span className="text-xs text-gray-500">Plateforme Officielle</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Barre de recherche centrale */}
            <div className="hidden md:flex flex-1 max-w-2xl mx-8">
              <div className="relative w-full">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Rechercher des discussions, événements, ressources..."
                  className="w-full pl-12 pr-6 py-3 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-200 text-sm"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <kbd className="px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-200 rounded">⌘K</kbd>
                </div>
              </div>
            </div>

            {/* Actions utilisateur */}
            <div className="flex items-center space-x-3">
              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="relative p-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-2xl transition-all duration-200"
                >
                  <Bell className="w-6 h-6" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Panel Notifications */}
                {notificationsOpen && (
                  <div className="absolute right-0 mt-4 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 text-white">
                      <h3 className="text-lg font-semibold">Notifications</h3>
                      <p className="text-blue-100 text-sm">{unreadCount} nouveau{unreadCount > 1 ? 'x' : ''} message{unreadCount > 1 ? 's' : ''}</p>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.map((notification) => (
                        <div key={notification.id} className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${notification.unread ? 'bg-blue-50' : ''}`}>
                          <div className="flex items-start space-x-3">
                            <div className={`w-3 h-3 rounded-full mt-2 ${getPriorityColor(notification.priority)} ${notification.unread ? 'animate-pulse' : ''}`}></div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                              <p className="text-sm text-gray-600 mt-1">{notification.description}</p>
                              <p className="text-xs text-gray-400 mt-2">Il y a {notification.time}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-4 bg-gray-50">
                      <button className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium">
                        Voir toutes les notifications
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Profil utilisateur */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-3 p-2 rounded-2xl hover:bg-gray-100 transition-all duration-200"
                >
                  <div className="hidden sm:block text-right">
                    <p className="text-sm font-semibold text-gray-900 flex items-center space-x-2">
                      <span>{user.name}</span>
                      {user.isVerified && (
                        <div className="flex items-center space-x-1">
                          <Shield className="w-4 h-4 text-green-500" />
                          <Star className="w-4 h-4 text-yellow-500" />
                        </div>
                      )}
                    </p>
                    <p className="text-xs text-gray-600">{user.role}</p>
                  </div>
                  <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                {/* Menu utilisateur */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 text-white">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center">
                          <User className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-semibold">{user.name}</p>
                          <p className="text-blue-100 text-sm">{user.role}</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-2">
                      <button
                        onClick={() => handleNavClick('profile')}
                        className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-100 transition-colors text-left"
                      >
                        <User className="w-5 h-5 text-gray-600" />
                        <span className="text-sm font-medium text-gray-900">Mon Profil</span>
                      </button>
                      <button
                        onClick={() => handleNavClick('settings')}
                        className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-100 transition-colors text-left"
                      >
                        <Settings className="w-5 h-5 text-gray-600" />
                        <span className="text-sm font-medium text-gray-900">Paramètres</span>
                      </button>
                      <hr className="my-2" />
                      <button
                        onClick={onLogout || (() => {})}
                        className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-red-50 transition-colors text-left text-red-600"
                      >
                        <LogOut className="w-5 h-5" />
                        <span className="text-sm font-medium">Se déconnecter</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Navigation rapide */}
          <div className="hidden lg:flex items-center justify-between py-3 border-t border-gray-100">
            <nav className="flex space-x-1">
              {navigation.map((item) => {
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                      currentPage === item.id
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                    <span className="text-sm">{item.name}</span>
                  </button>
                );
              })}
            </nav>
            
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>156 membres connectées</span>
              <span>•</span>
              <span>23 discussions actives</span>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar Mobile Premium */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-80 bg-white shadow-2xl z-50 overflow-hidden">
            {/* Header Sidebar */}
            <div className="bg-gradient-to-r from-green-600 via-yellow-500 to-blue-600 p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold">MF</span>
                  </div>
                  <div>
                    <h3 className="font-bold">Menu Principal</h3>
                    <p className="text-sm opacity-90">Navigation</p>
                  </div>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 rounded-xl hover:bg-white hover:bg-opacity-20 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Navigation Sidebar */}
            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
              {navigation.map((item) => {
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center space-x-4 p-4 rounded-2xl font-medium transition-all duration-200 ${
                      currentPage === item.id
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <IconComponent className="w-5 h-5" />
                    <div className="text-left">
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className={`text-xs ${currentPage === item.id ? 'text-blue-100' : 'text-gray-500'}`}>
                        {item.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </nav>

            {/* Footer Sidebar */}
            <div className="p-4 border-t border-gray-200">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">🆘 Besoin d'aide ?</h4>
                <p className="text-xs text-gray-600 mb-3">
                  Consultez notre guide d'utilisation ou contactez le support.
                </p>
                <button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium py-2 px-4 rounded-xl hover:shadow-lg transition-all duration-200">
                  Aide & Support
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overlay pour fermer les dropdowns */}
      {(notificationsOpen || userMenuOpen) && (
        <div 
          className="fixed inset-0 z-30" 
          onClick={() => {
            setNotificationsOpen(false);
            setUserMenuOpen(false);
          }}
        />
      )}
    </>
  );
};

export default PremiumHeader;