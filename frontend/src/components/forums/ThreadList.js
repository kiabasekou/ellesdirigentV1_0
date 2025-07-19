import React from 'react';
import { MessageCircle, Eye, Clock, User } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const ThreadList = ({ threads, onThreadSelect, loading, emptyMessage }) => {
  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-gray-200 h-20 rounded-lg"></div>
        ))}
      </div>
    );
  }

  if (!threads.length) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {threads.map((thread) => (
        <div
          key={thread.id}
          onClick={() => onThreadSelect(thread)}
          className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 hover:text-blue-600">
                {thread.title}
              </h3>
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                <span className="flex items-center">
                  <User className="w-4 h-4 mr-1" />
                  {thread.author?.name || 'Anonyme'}
                </span>
                <span className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {format(new Date(thread.created_at), 'dd MMM', { locale: fr })}
                </span>
                <span className="flex items-center">
                  <MessageCircle className="w-4 h-4 mr-1" />
                  {thread.replies_count || 0} réponses
                </span>
                <span className="flex items-center">
                  <Eye className="w-4 h-4 mr-1" />
                  {thread.views_count || 0} vues
                </span>
              </div>
            </div>
            {thread.is_pinned && (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                Épinglé
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ThreadList;