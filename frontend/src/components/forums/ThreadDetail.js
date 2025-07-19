import React, { useState } from 'react';
import { ArrowLeft, MessageCircle, Heart, Share2, Flag } from 'lucide-react';
import PostEditor from './PostEditor';

const ThreadDetail = ({ thread, onBack, onUpdate }) => {
  const [showReply, setShowReply] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-sm">
      <div className="p-6 border-b">
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Retour aux sujets
        </button>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{thread.title}</h1>
        <div className="flex items-center text-sm text-gray-500">
          <span>Par {thread.author?.name}</span>
          <span className="mx-2">•</span>
          <span>{new Date(thread.created_at).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="p-6">
        <div className="prose max-w-none mb-6">
          {thread.content}
        </div>

        <div className="flex items-center space-x-4 pt-4 border-t">
          <button className="flex items-center space-x-2 text-gray-600 hover:text-red-600">
            <Heart className="w-5 h-5" />
            <span>{thread.likes_count || 0}</span>
          </button>
          <button
            onClick={() => setShowReply(!showReply)}
            className="flex items-center space-x-2 text-gray-600 hover:text-blue-600"
          >
            <MessageCircle className="w-5 h-5" />
            <span>Répondre</span>
          </button>
          <button className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
            <Share2 className="w-5 h-5" />
            <span>Partager</span>
          </button>
        </div>

        {showReply && (
          <div className="mt-6">
            <PostEditor
              onSubmit={(content) => {
                // Logique pour poster une réponse
                setShowReply(false);
              }}
              onCancel={() => setShowReply(false)}
              mode="reply"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ThreadDetail;