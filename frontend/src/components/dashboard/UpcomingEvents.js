
import React from 'react';
import { CalendarDaysIcon, MapPinIcon, ClockIcon, UsersIcon } from '@heroicons/react/24/outline';

const upcomingEvents = [
  {
    id: 1,
    title: 'Formation Leadership Féminin en Action',
    date: '2025-05-27',
    time: '14:00',
    location: 'Salle de conférence - Ministère',
    participants: 45,
    maxParticipants: 50,
    type: 'formation',
    registered: true
  },
  {
    id: 2,
    title: 'Atelier : Stratégies de communication politique',
    date: '2025-05-30',
    time: '09:00',
    location: 'En ligne - Zoom',
    participants: 28,
    maxParticipants: 40,
    type: 'atelier',
    registered: false
  },
  {
    id: 3,
    title: 'Débat : Femmes et gouvernance locale',
    date: '2025-06-02',
    time: '16:00',
    location: 'Centre culturel Libreville',
    participants: 67,
    maxParticipants: 80,
    type: 'debat',
    registered: true
  }
];

const UpcomingEvents = () => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short' 
    });
  };

  const getEventTypeColor = (type) => {
    switch (type) {
      case 'formation': return 'bg-blue-100 text-blue-800';
      case 'atelier': return 'bg-green-100 text-green-800';
      case 'debat': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Événements à venir</h3>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {upcomingEvents.map((event) => (
            <div key={event.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="text-sm font-medium text-gray-900">{event.title}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEventTypeColor(event.type)}`}>
                      {event.type}
                    </span>
                  </div>
                  
                  <div className="space-y-1 text-xs text-gray-500">
                    <div className="flex items-center space-x-2">
                      <CalendarDaysIcon className="w-4 h-4" />
                      <span>{formatDate(event.date)}</span>
                      <ClockIcon className="w-4 h-4 ml-2" />
                      <span>{event.time}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPinIcon className="w-4 h-4" />
                      <span>{event.location}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <UsersIcon className="w-4 h-4" />
                      <span>{event.participants}/{event.maxParticipants} participants</span>
                    </div>
                  </div>
                </div>
                
                <div className="ml-4">
                  {event.registered ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      ✓ Inscrite
                    </span>
                  ) : (
                    <button className="inline-flex items-center px-3 py-1 border border-primary-300 text-xs font-medium rounded-md text-primary-700 bg-white hover:bg-primary-50">
                      S'inscrire
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6">
          <button className="w-full text-sm text-primary-600 hover:text-primary-700 font-medium">
            Voir tous les événements
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpcomingEvents;