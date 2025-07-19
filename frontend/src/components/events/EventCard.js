import React from 'react';
import { Calendar, MapPin, Users, Video, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const EventCard = ({ event, onClick }) => {
  const categoryColors = {
    formation: 'blue',
    conference: 'purple',
    atelier: 'green',
    networking: 'yellow',
    webinaire: 'red'
  };

  const color = categoryColors[event.category] || 'gray';

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
    >
      {event.image ? (
        <img
          src={event.image}
          alt={event.title}
          className="w-full h-48 object-cover"
        />
      ) : (
        <div className={`h-48 bg-gradient-to-br from-${color}-400 to-${color}-600 flex items-center justify-center`}>
          <Calendar className="w-16 h-16 text-white opacity-50" />
        </div>
      )}

      <div className="p-6">
        <div className="flex items-center justify-between mb-2">
          <span className={`px-3 py-1 bg-${color}-100 text-${color}-700 text-xs rounded-full font-medium`}>
            {event.category}
          </span>
          {event.is_registered && (
            <span className="text-green-600 text-sm font-medium">✓ Inscrite</span>
          )}
        </div>

        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {event.title}
        </h3>

        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-2" />
            {format(new Date(event.date), 'dd MMMM yyyy à HH:mm', { locale: fr })}
          </div>
          
          <div className="flex items-center">
            {event.is_online ? (
              <>
                <Video className="w-4 h-4 mr-2" />
                <span>En ligne</span>
              </>
            ) : (
              <>
                <MapPin className="w-4 h-4 mr-2" />
                <span className="truncate">{event.location}</span>
              </>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Users className="w-4 h-4 mr-2" />
              <span>{event.current_participants}/{event.max_participants}</span>
            </div>
            {event.price > 0 && (
              <span className="font-medium">{event.price} FCFA</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventCard;