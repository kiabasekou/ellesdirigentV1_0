import React from 'react';
import { MessageSquare, Users, Clock, ChevronRight } from 'lucide-react';

const ForumList = ({ categories, onCategorySelect, loading }) => {
  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-gray-200 h-24 rounded-lg"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {categories.map((category) => (
        <div
          key={category.id}
          onClick={() => onCategorySelect(category)}
          className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-lg bg-${category.color || 'blue'}-100`}>
                <MessageSquare className={`w-6 h-6 text-${category.color || 'blue'}-600`} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                  <span className="flex items-center">
                    <MessageSquare className="w-3 h-3 mr-1" />
                    {category.threads_count || 0} sujets
                  </span>
                  <span className="flex items-center">
                    <Users className="w-3 h-3 mr-1" />
                    {category.posts_count || 0} messages
                  </span>
                </div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default ForumList;