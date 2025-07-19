import React from 'react';
import { MessageSquare, Calendar, BookOpen, TrendingUp } from 'lucide-react';

const EngagementMetrics = ({ metrics }) => {
  const sections = [
    {
      title: 'Engagement Forums',
      icon: MessageSquare,
      color: 'blue',
      metrics: [
        { label: 'Posts', value: metrics.forumEngagement.posts },
        { label: 'Réponses', value: metrics.forumEngagement.replies },
        { label: 'Utilisatrices actives', value: metrics.forumEngagement.activeUsers },
        { label: 'Moy. posts/utilisatrice', value: metrics.forumEngagement.avgPostsPerUser }
      ]
    },
    {
      title: 'Engagement Événements',
      icon: Calendar,
      color: 'purple',
      metrics: [
        { label: 'Inscriptions', value: metrics.eventEngagement.totalRegistrations },
        { label: 'Taux participation', value: `${metrics.eventEngagement.attendanceRate}%` },
        { label: 'Satisfaction', value: `${metrics.eventEngagement.satisfactionScore}/5` },
        { label: 'Participants récurrents', value: metrics.eventEngagement.recurringAttendees }
      ]
    },
    {
      title: 'Engagement Ressources',
      icon: BookOpen,
      color: 'green',
      metrics: [
        { label: 'Téléchargements', value: metrics.resourceEngagement.downloads },
        { label: 'Uploads', value: metrics.resourceEngagement.uploads },
        { label: 'Note moyenne', value: `${metrics.resourceEngagement.avgRating}/5` },
        { label: 'Top catégorie', value: metrics.resourceEngagement.topCategories[0] }
      ]
    }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {sections.map((section, index) => {
        const IconComponent = section.icon;
        
        return (
          <div key={index} className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center mb-4">
              <div className={`p-2 rounded-lg bg-${section.color}-100 mr-3`}>
                <IconComponent className={`w-5 h-5 text-${section.color}-600`} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
            </div>
            
            <div className="space-y-3">
              {section.metrics.map((metric, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{metric.label}</span>
                  <span className="text-sm font-medium text-gray-900">
                    {typeof metric.value === 'number' ? metric.value.toLocaleString() : metric.value}
                  </span>
                </div>
              ))}
            </div>
            
            <div className="mt-4 pt-4 border-t">
              <button className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center">
                <TrendingUp className="w-4 h-4 mr-1" />
                Voir les détails
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default EngagementMetrics;