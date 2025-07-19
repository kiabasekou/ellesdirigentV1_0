/**
 * Page Événements - Calendrier et gestion des événements
 * Inscription, rappels, et participation aux événements
 */
import React, { useState, useEffect } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isSameMonth, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  Calendar,
  CalendarDays,
  Clock,
  MapPin,
  Users,
  Video,
  ChevronLeft,
  ChevronRight,
  Plus,
  Filter,
  Search,
  Globe,
  Star,
  Tag,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Bell,
  Share2,
  Loader
} from 'lucide-react';
import { eventService } from '../services/eventService';
import { useEvents } from '../hooks/useEvents';
import { toast } from '../components/Toast';
import EventList from '../components/events/EventList';
import EventCard from '../components/events/EventCard';
import EventDetail from '../components/events/EventDetail';
import EventRegistration from '../components/events/EventRegistration';

const Events = () => {
  const { events, loading, error, fetchEvents, registerForEvent, unregisterFromEvent } = useEvents();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventDetail, setShowEventDetail] = useState(false);
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' | 'list'
  const [filterType, setFilterType] = useState('all'); // 'all' | 'upcoming' | 'past' | 'registered'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Catégories d'événements
  const eventCategories = [
    { value: 'all', label: 'Toutes les catégories', icon: Globe },
    { value: 'formation', label: 'Formations', icon: CalendarDays, color: 'blue' },
    { value: 'conference', label: 'Conférences', icon: Users, color: 'purple' },
    { value: 'atelier', label: 'Ateliers', icon: TrendingUp, color: 'green' },
    { value: 'networking', label: 'Réseautage', icon: Share2, color: 'yellow' },
    { value: 'webinaire', label: 'Webinaires', icon: Video, color: 'red' }
  ];

  // Événements de démonstration
  const demoEvents = [
    {
      id: 1,
      title: 'Formation Leadership Féminin',
      description: 'Développez vos compétences de leadership et apprenez les stratégies pour réussir en politique',
      category: 'formation',
      date: new Date(2024, 0, 15, 14, 0),
      end_date: new Date(2024, 0, 15, 17, 0),
      location: 'Centre de Conférences, Libreville',
      is_online: false,
      max_participants: 50,
      current_participants: 32,
      speaker: 'Dr. Marie Nguema',
      price: 0,
      is_registered: false,
      tags: ['leadership', 'développement personnel', 'politique']
    },
    {
      id: 2,
      title: 'Webinaire: Communication Politique Efficace',
      description: 'Maîtrisez l\'art de la communication politique à l\'ère digitale',
      category: 'webinaire',
      date: new Date(2024, 0, 18, 20, 0),
      end_date: new Date(2024, 0, 18, 21, 30),
      location: 'En ligne',
      is_online: true,
      meeting_link: 'https://zoom.us/j/123456789',
      max_participants: 100,
      current_participants: 67,
      speaker: 'Jeanne Mbadinga',
      price: 0,
      is_registered: true,
      tags: ['communication', 'médias sociaux', 'stratégie']
    },
    {
      id: 3,
      title: 'Atelier Pratique: Campagne Électorale',
      description: 'Apprenez à organiser et gérer une campagne électorale réussie',
      category: 'atelier',
      date: new Date(2024, 0, 22, 9, 0),
      end_date: new Date(2024, 0, 22, 17, 0),
      location: 'Hôtel Radisson, Port-Gentil',
      is_online: false,
      max_participants: 30,
      current_participants: 28,
      speaker: 'Équipe Campaign Academy',
      price: 25000,
      is_registered: false,
      tags: ['campagne', 'stratégie', 'organisation']
    }
  ];

  useEffect(() => {
    loadEvents();
  }, [currentDate, filterType, selectedCategory]);

  const loadEvents = async () => {
    try {
      const startDate = startOfMonth(currentDate);
      const endDate = endOfMonth(currentDate);
      
      await fetchEvents({
        start_date: format(startDate, 'yyyy-MM-dd'),
        end_date: format(endDate, 'yyyy-MM-dd'),
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        filter: filterType
      });
    } catch (error) {
      console.error('Erreur chargement événements:', error);
    }
  };

  const handlePreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setShowEventDetail(true);
  };

  const handleRegister = async (eventId, formData) => {
    try {
      await registerForEvent(eventId, formData);
      toast.success('Inscription confirmée! Vous recevrez un email de confirmation.');
      
      // Mettre à jour l'événement localement
      setSelectedEvent(prev => ({
        ...prev,
        is_registered: true,
        current_participants: prev.current_participants + 1
      }));
    } catch (error) {
      toast.error('Erreur lors de l\'inscription');
    }
  };

  const handleUnregister = async (eventId) => {
    try {
      await unregisterFromEvent(eventId);
      toast.success('Désinscription confirmée');
      
      // Mettre à jour l'événement localement
      setSelectedEvent(prev => ({
        ...prev,
        is_registered: false,
        current_participants: prev.current_participants - 1
      }));
    } catch (error) {
      toast.error('Erreur lors de la désinscription');
    }
  };

  const getDaysInMonth = () => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return eachDayOfInterval({ start, end });
  };

  const getEventsForDay = (day) => {
    const eventsData = events.length > 0 ? events : demoEvents;
    return eventsData.filter(event => 
      isSameDay(new Date(event.date), day)
    );
  };

  const filteredEvents = () => {
    let eventsData = events.length > 0 ? events : demoEvents;
    
    // Filtre par recherche
    if (searchTerm) {
      eventsData = eventsData.filter(event =>
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.speaker?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filtre par catégorie
    if (selectedCategory !== 'all') {
      eventsData = eventsData.filter(event => event.category === selectedCategory);
    }
    
    // Filtre par type
    const now = new Date();
    switch (filterType) {
      case 'upcoming':
        eventsData = eventsData.filter(event => new Date(event.date) > now);
        break;
      case 'past':
        eventsData = eventsData.filter(event => new Date(event.date) < now);
        break;
      case 'registered':
        eventsData = eventsData.filter(event => event.is_registered);
        break;
      default:
        break;
    }
    
    return eventsData;
  };

  const upcomingEvents = filteredEvents()
    .filter(event => new Date(event.date) > new Date())
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 5);

  if (loading && !events.length) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* En-tête */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-white mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl font-bold mb-4">Événements & Formations</h1>
            <p className="text-purple-100">
              Participez aux événements pour développer vos compétences et élargir votre réseau
            </p>
          </div>
          
          {/* Barre de recherche */}
          <div className="w-full md:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-200" />
              <input
                type="text"
                placeholder="Rechercher un événement..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full md:w-80 pl-10 pr-4 py-3 bg-white/20 backdrop-blur-sm rounded-lg placeholder-purple-200 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
              />
            </div>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
            <Calendar className="w-6 h-6 mb-1" />
            <div className="text-xl font-bold">{filteredEvents().length}</div>
            <div className="text-sm text-purple-100">Événements</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
            <TrendingUp className="w-6 h-6 mb-1" />
            <div className="text-xl font-bold">{upcomingEvents.length}</div>
            <div className="text-sm text-purple-100">À venir</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
            <CheckCircle className="w-6 h-6 mb-1" />
            <div className="text-xl font-bold">
              {filteredEvents().filter(e => e.is_registered).length}
            </div>
            <div className="text-sm text-purple-100">Inscriptions</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
            <Star className="w-6 h-6 mb-1" />
            <div className="text-xl font-bold">4.8</div>
            <div className="text-sm text-purple-100">Note moyenne</div>
          </div>
        </div>
      </div>

      {/* Contrôles et filtres */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-4">
            {/* Toggle vue */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'calendar'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <CalendarDays className="w-4 h-4 inline mr-2" />
                Calendrier
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Users className="w-4 h-4 inline mr-2" />
                Liste
              </button>
            </div>

            {/* Bouton filtres */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Filter className="w-4 h-4" />
              <span>Filtres</span>
            </button>
          </div>

          {/* Actions */}
          <button className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105">
            <Plus className="w-5 h-5 inline mr-2" />
            Proposer un événement
          </button>
        </div>

        {/* Filtres expandables */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t space-y-4">
            {/* Catégories */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Catégories</h3>
              <div className="flex flex-wrap gap-2">
                {eventCategories.map((category) => {
                  const IconComponent = category.icon;
                  return (
                    <button
                      key={category.value}
                      onClick={() => setSelectedCategory(category.value)}
                      className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedCategory === category.value
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <IconComponent className="w-4 h-4 mr-2" />
                      {category.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Type d'événements */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Afficher</h3>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'all', label: 'Tous' },
                  { value: 'upcoming', label: 'À venir' },
                  { value: 'past', label: 'Passés' },
                  { value: 'registered', label: 'Mes inscriptions' }
                ].map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => setFilterType(filter.value)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filterType === filter.value
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Contenu principal */}
      {viewMode === 'calendar' ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendrier */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm p-6">
              {/* En-tête du calendrier */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {format(currentDate, 'MMMM yyyy', { locale: fr })}
                </h2>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handlePreviousMonth}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setCurrentDate(new Date())}
                    className="px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
                  >
                    Aujourd'hui
                  </button>
                  <button
                    onClick={handleNextMonth}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Grille du calendrier */}
              <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
                {/* Jours de la semaine */}
                {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
                  <div
                    key={day}
                    className="bg-gray-50 py-2 text-center text-sm font-medium text-gray-700"
                  >
                    {day}
                  </div>
                ))}

                {/* Jours du mois */}
                {getDaysInMonth().map((day, index) => {
                  const dayEvents = getEventsForDay(day);
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  const isCurrentDay = isToday(day);

                  return (
                    <div
                      key={index}
                      className={`bg-white p-2 min-h-[100px] ${
                        !isCurrentMonth ? 'opacity-50' : ''
                      } ${isCurrentDay ? 'ring-2 ring-purple-500' : ''}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-sm font-medium ${
                          isCurrentDay ? 'text-purple-600' : 'text-gray-900'
                        }`}>
                          {format(day, 'd')}
                        </span>
                        {dayEvents.length > 0 && (
                          <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full">
                            {dayEvents.length}
                          </span>
                        )}
                      </div>

                      {/* Événements du jour */}
                      <div className="space-y-1">
                        {dayEvents.slice(0, 2).map((event) => (
                          <button
                            key={event.id}
                            onClick={() => handleEventClick(event)}
                            className="w-full text-left p-1 text-xs rounded bg-purple-50 hover:bg-purple-100 text-purple-700 truncate transition-colors"
                          >
                            {format(new Date(event.date), 'HH:mm')} - {event.title}
                          </button>
                        ))}
                        {dayEvents.length > 2 && (
                          <button
                            onClick={() => {
                              setFilterType('all');
                              setViewMode('list');
                            }}
                            className="w-full text-center text-xs text-purple-600 hover:text-purple-700"
                          >
                            +{dayEvents.length - 2} autres
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sidebar - Événements à venir */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-4 sticky top-4">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 text-purple-600 mr-2" />
                Prochains événements
              </h3>
              
              {upcomingEvents.length > 0 ? (
                <div className="space-y-3">
                  {upcomingEvents.map((event) => {
                    const category = eventCategories.find(c => c.value === event.category);
                    const IconComponent = category?.icon || Calendar;
                    
                    return (
                      <button
                        key={event.id}
                        onClick={() => handleEventClick(event)}
                        className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all group"
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`p-2 rounded-lg bg-${category?.color || 'purple'}-100 group-hover:scale-110 transition-transform`}>
                            <IconComponent className={`w-4 h-4 text-${category?.color || 'purple'}-600`} />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 text-sm mb-1 line-clamp-2">
                              {event.title}
                            </h4>
                            <p className="text-xs text-gray-500">
                              {format(new Date(event.date), 'dd MMM à HH:mm', { locale: fr })}
                            </p>
                            {event.is_online ? (
                              <div className="flex items-center mt-1">
                                <Video className="w-3 h-3 text-gray-400 mr-1" />
                                <span className="text-xs text-gray-500">En ligne</span>
                              </div>
                            ) : (
                              <div className="flex items-center mt-1">
                                <MapPin className="w-3 h-3 text-gray-400 mr-1" />
                                <span className="text-xs text-gray-500 truncate">
                                  {event.location}
                                </span>
                              </div>
                            )}
                            {event.is_registered && (
                              <span className="inline-flex items-center mt-2 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Inscrite
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">
                  Aucun événement à venir
                </p>
              )}

              {/* Actions rapides */}
              <div className="mt-6 space-y-2">
                <button className="w-full px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors text-sm font-medium">
                  <Bell className="w-4 h-4 inline mr-2" />
                  Activer les rappels
                </button>
                <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                  <Share2 className="w-4 h-4 inline mr-2" />
                  Partager le calendrier
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Vue liste */
        <EventList
          events={filteredEvents()}
          onEventClick={handleEventClick}
          loading={loading}
          emptyMessage="Aucun événement trouvé avec ces critères"
        />
      )}

      {/* Modal détail événement */}
      {showEventDetail && selectedEvent && (
        <EventDetail
          event={selectedEvent}
          onClose={() => {
            setShowEventDetail(false);
            setSelectedEvent(null);
          }}
          onRegister={handleRegister}
          onUnregister={handleUnregister}
        />
      )}
    </div>
  );
};

export default Events;