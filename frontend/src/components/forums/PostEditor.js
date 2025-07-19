import React, { useState } from 'react';
import { Send, X } from 'lucide-react';

const PostEditor = ({ onSubmit, onCancel, mode = 'post', category }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState([]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mode === 'thread' && !title.trim()) return;
    if (!content.trim()) return;

    onSubmit({
      title: mode === 'thread' ? title : undefined,
      content,
      tags,
      category_id: category?.id
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {mode === 'thread' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Titre du sujet
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Titre de votre discussion"
            required
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {mode === 'thread' ? 'Contenu' : 'Votre réponse'}
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={6}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder={mode === 'thread' ? 'Décrivez votre sujet...' : 'Écrivez votre réponse...'}
          required
        />
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          <X className="w-5 h-5 inline mr-2" />
          Annuler
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Send className="w-5 h-5 inline mr-2" />
          {mode === 'thread' ? 'Créer le sujet' : 'Publier'}
        </button>
      </div>
    </form>
  );
};

export default PostEditor;