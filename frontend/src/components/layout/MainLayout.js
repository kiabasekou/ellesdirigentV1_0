// ============================================================================
// frontend/src/components/layout/MainLayout.js - CORRECTION COMPLÈTE
// ============================================================================

import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Menu, X, Home, User, MessageSquare, Calendar, BookOpen, Users, BarChart3,
  Settings, LogOut, Bell, Search, ChevronDown, Clock, Shield, Sun, Moon,
  GraduationCap, Trophy, FileText, BarChart // NOUVELLES ICÔNES AJOUTÉES
} from 'lucide-react';
import { logout } from '../../redux/authSlice';
import { toast } from '../Toast'; // Assurez-vous que le chemin vers Toast est correct
import api, { authAPI } from '../../api'; // Importe l'instance 'api' par défaut et 'authAPI'

const MainLayout = ({ isAdmin = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const user = useSelector(state => state.auth.user);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Navigation items
  const navigation = isAdmin ? [
    { id: 'admin-dashboard', name: 'Dashboard Admin', icon: BarChart3, href: '/admin' },
    { id: 'admin-participants', name: 'Participants', icon: Users, href: '/admin/participants/pending' },
    { id: 'admin-formations', name: 'Formations', icon: GraduationCap, href: '/admin/formations' },
    { id: 'admin-quiz', name: 'Quiz', icon: FileText, href: '/admin/quiz' },
    { id: 'admin-stats', name: 'Statistiques', icon: BarChart, href: '/admin/stats' }
  ] : [
    { id: 'dashboard', name: 'Tableau de bord', icon: Home, href: '/dashboard' },
    { id: 'profile', name: 'Mon Profil', icon: User, href: '/dashboard/profile' },
    { id: 'formations', name: 'Formations', icon: GraduationCap, href: '/dashboard/formations' }, // NOUVEAU
    { id: 'mes-formations', name: 'Mes Formations', icon: Trophy, href: '/dashboard/mes-formations' }, // NOUVEAU
    { id: 'certificats', name: 'Certificats', icon: FileText, href: '/dashboard/certificats' }, // NOUVEAU
    { id: 'forums', name: 'Forums', icon: MessageSquare, href: '/dashboard/forums' },
    { id: 'events', name: 'Événements', icon: Calendar, href: '/dashboard/events' },
    { id: 'resources', name: 'Ressources', icon: BookOpen, href: '/dashboard/resources' },
    { id: 'networking', name: 'Réseautage', icon: Users, href: '/dashboard/networking' },
    { id: 'stats', name: 'Statistiques', icon: BarChart3, href: '/dashboard/stats' }
  ];

  useEffect(() => {
    // Charger les notifications
    fetchNotifications();

    // Mettre à jour l'activité toutes les 5 minutes
    const activityInterval = setInterval(() => {
      updateActivity();
    }, 5 * 60 * 1000);

    // Nettoyer les intervals
    return () => {
      clearInterval(activityInterval);
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      // CORRECTION: Utiliser l'instance 'api' pour un endpoint de notifications générique
      // Si vous avez une API de notifications spécifique, vous devrez l'ajouter à api.js
      const response = await api.get('/notifications/'); // Supposition d'un endpoint /notifications/
      setNotifications(response.data.results || []);
    } catch (error) {
      console.error('Erreur chargement notifications:', error);
    }
  };

  const updateActivity = async () => {
    try {
      // CORRECTION: Utiliser l'instance 'api' au lieu de 'axios' et enlever le préfixe '/api'
      await api.post('/users/activity/');
    } catch (error) {
      console.error('Erreur mise à jour activité:', error);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    toast.success('Déconnexion réussie');
    navigate('/login');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  const unreadNotifications = notifications.filter(n => !n.read).length;

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">

        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 py-3 sm:px-6 lg:px-8">

            {/* Logo et titre - MISE À JOUR POUR ELLES DIRIGENT */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Menu className="w-6 h-6" />
              </button>

              <div className="flex items-center space-x-3">
                {/* Logo Elles Dirigent */}
                <div className="w-10 h-10">
                  <img
                    src="/logo-elles-dirigent.png"
                    alt="Elles Dirigent"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Elles Dirigent
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    République Gabonaise
                  </p>
                </div>
              </div>
            </div>

            {/* Barre de recherche */}
            <div className="hidden md:flex flex-1 max-w-lg mx-8">
              <form onSubmit={handleSearch} className="relative w-full">
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
              </form>
            </div>

            {/* Actions header */}
            <div className="flex items-center space-x-4">

              {/* Bouton mode sombre */}
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700"
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 relative"
                >
                  <Bell className="w-5 h-5" />
                  {unreadNotifications > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {unreadNotifications}
                    </span>
                  )}
                </button>

                {/* Dropdown notifications */}
                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">Notifications</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.slice(0, 5).map((notification) => (
                          <div key={notification.id} className="p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                            <div className="flex items-start space-x-3">
                              <div className={`w-2 h-2 rounded-full mt-2 ${notification.read ? 'bg-gray-300' : 'bg-blue-500'}`} />
                              <div className="flex-1">
                                <p className="text-sm text-gray-900 dark:text-white">{notification.message}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  <Clock className="w-3 h-3 inline mr-1" />
                                  {notification.created_at}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                          Aucune notification
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Menu utilisateur */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {user?.first_name?.[0] || user?.username?.[0] || 'U'}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>

                {/* Dropdown menu utilisateur */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {user?.first_name} {user?.last_name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                    </div>
                    <div className="py-1">
                      <button
                        onClick={() => navigate('/dashboard/profile')}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <User className="w-4 h-4 mr-3" />
                        Mon profil
                      </button>
                      <button
                        onClick={() => navigate('/dashboard/settings')}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <Settings className="w-4 h-4 mr-3" />
                        Paramètres
                      </button>
                      <hr className="my-1 border-gray-200 dark:border-gray-700" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <LogOut className="w-4 h-4 mr-3" />
                        Se déconnecter
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Sidebar mobile */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white dark:bg-gray-800">
              <div className="absolute top-0 right-0 -mr-12 pt-2">
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                >
                  <X className="h-6 w-6 text-white" />
                </button>
              </div>

              {/* Logo sidebar mobile */}
              <div className="flex items-center flex-shrink-0 px-4 py-4 border-b border-gray-200 dark:border-gray-700">
                <img
                  src="/logo-elles-dirigent.png"
                  alt="Elles Dirigent"
                  className="w-8 h-8 object-contain"
                />
                <span className="ml-3 text-lg font-semibold text-gray-900 dark:text-white">
                  Elles Dirigent
                </span>
              </div>

              {/* Navigation sidebar */}
              <div className="mt-5 flex-1 h-0 overflow-y-auto">
                <nav className="px-2 space-y-1">
                  {navigation.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.href;

                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          navigate(item.href);
                          setSidebarOpen(false);
                        }}
                        className={`group flex items-center px-2 py-2 text-base font-medium rounded-md w-full ${
                          isActive
                            ? 'bg-gradient-to-r from-blue-500 to-green-500 text-white'
                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                        }`}
                      >
                        <Icon className="mr-4 h-5 w-5" />
                        {item.name}
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>
          </div>
        )}

        {/* Sidebar desktop */}
        <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:top-16">
          <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <nav className="mt-5 flex-1 px-2 space-y-1">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href;

                  return (
                    <button
                      key={item.id}
                      onClick={() => navigate(item.href)}
                      className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-500 to-green-500 text-white'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      <Icon className="mr-3 h-5 w-5" />
                      {item.name}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="lg:pl-64 flex flex-col flex-1">
          <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none">
            <div className="py-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                <Outlet />
              </div>
            </div>
          </main>
        </div>

        {/* Overlay pour fermer les menus */}
        {(userMenuOpen || notificationsOpen) && (
          <div
            className="fixed inset-0 z-30"
            onClick={() => {
              setUserMenuOpen(false);
              setNotificationsOpen(false);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default MainLayout;
