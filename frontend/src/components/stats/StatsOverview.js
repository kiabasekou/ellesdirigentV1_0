import React from 'react';
import { TrendingUp, TrendingDown, Users, Calendar, MessageSquare, FileText } from 'lucide-react';

const StatsOverview = ({ stats }) => {
  const statCards = [
    {
      title: 'Membres actives',
      value: stats.totalMembers,
      change: stats.growthRate,
      icon: Users,
      color: 'blue'
    },
    {
      title: 'Événements',
      value: stats.totalEvents,
      subtitle: `${stats.eventsAttendance} participations`,
      icon: Calendar,
      color: 'purple'
    },
    {
      title: 'Messages forum',
      value: stats.forumPosts,
      subtitle: `${stats.activeMembersRate}% actives`,
      icon: MessageSquare,
      color: 'green'
    },
    {
      title: 'Ressources',
      value: stats.resourcesDownloaded,
      subtitle: `+${stats.newMembersThisMonth} ce mois`,
      icon: FileText,
      color: 'yellow'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat, index) => {
        const IconComponent = stat.icon;
        const isPositive = stat.change > 0;
        
        return (
          <div key={index} className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg bg-${stat.color}-100`}>
                <IconComponent className={`w-6 h-6 text-${stat.color}-600`} />
              </div>
              {stat.change !== undefined && (
                <div className={`flex items-center text-sm ${
                  isPositive ? 'text-green-600' : 'text-red-600'
                }`}>
                  {isPositive ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                  {Math.abs(stat.change)}%
                </div>
              )}
            </div>
            
            <h3 className="text-gray-600 text-sm font-medium">{stat.title}</h3>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value.toLocaleString()}</p>
            {stat.subtitle && (
              <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default StatsOverview;