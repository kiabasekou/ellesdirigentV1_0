import React from 'react';
import { X, Calendar, MapPin, Users, Video, Clock, User } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const EventDetail = ({ event, onClose, onRegister, onUnregister }) => {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
        
        <div className="relative bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-bold">Détails de l'événement</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            {event.image && (
              <img
                src={event.image}
                alt={event.title}
                className="w-full h-64 object-cover rounded-lg mb-6"
              />
            )}

            <h1 className="text-2xl font-bold text-gray-900 mb-4">{event.title}</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="flex items-center text-gray-600">
                <Calendar className="w-5 h-5 mr-3" />
                <div>
                  <p className="font-medium">Date et heure</p>
                  <p className="text-sm">
                    {format(new Date(event.date), 'EEEE dd MMMM yyyy', { locale: fr })}
                    <br />
                    {format(new Date(event.date), 'HH:mm')} - {format(new Date(event.end_date), 'HH:mm')}
                  </p>
                </div>
              </div>

              <div className="flex items-center text-gray-600">
                {event.is_online ? (
                  <>
                    <Video className="w-5 h-5 mr-3" />
                    <div>
                      <p className="font-medium">Événement en ligne</p>
                      <p className="text-sm">Lien envoyé après inscription</p>
                    </div>
                  </>
                ) : (
                  <>
                    <MapPin className="w-5 h-5 mr-3" />
                    <div>
                      <p className="font-medium">Lieu</p>
                      <p className="text-sm">{event.location}</p>
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center text-gray-600">
                <Users className="w-5 h-5 mr-3" />
                <div>
                  <p className="font-medium">Participants</p>
                  <p className="text-sm">
                    {event.current_participants} / {event.max_participants} inscrits
                  </p>
                </div>
              </div>

              <div className="flex items-center text-gray-600">
                <User className="w-5 h-5 mr-3" />
                <div>
                  <p className="font-medium">Intervenant</p>
                  <p className="text-sm">{event.speaker}</p>
                </div>
              </div>
            </div>

            <div className="prose max-w-none mb-6">
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <p className="text-gray-600">{event.description}</p>
            </div>

            {event.tags && event.tags.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {event.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t pt-6">
              {event.is_registered ? (
                <button
                  onClick={() => onUnregister(event.id)}
                  className="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Se désinscrire
                </button>
              ) : (
                <button
                  onClick={() => onRegister(event.id)}
                  className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  disabled={event.current_participants >= event.max_participants}
                >
                  {event.current_participants >= event.max_participants
                    ? 'Complet'
                    : event.price > 0
                    ? `S'inscrire (${event.price} FCFA)`
                    : "S'inscrire gratuitement"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetail;