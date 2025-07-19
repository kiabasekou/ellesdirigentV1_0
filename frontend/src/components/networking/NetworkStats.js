
import React from 'react';
import { Users, UserCheck, UserPlus, Globe } from 'lucide-react';

const NetworkStats = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
        <Users className="w-8 h-8 mb-2" />
        <div className="text-2xl font-bold">{stats.totalConnections}</div>
        <div className="text-sm text-indigo-100">Connexions</div>
      </div>
      
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
        <UserPlus className="w-8 h-8 mb-2" />
        <div className="text-2xl font-bold">{stats.pendingRequests}</div>
        <div className="text-sm text-indigo-100">Demandes</div>
      </div>

      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
        <UserCheck className="w-8 h-8 mb-2" />
        <div className="text-2xl font-bold">{stats.mentorsAvailable}</div>
        <div className="text-sm text-indigo-100">Mentors</div>
      </div>

      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
        <Globe className="w-8 h-8 mb-2" />
        <div className="text-2xl font-bold">{stats.onlineNow}</div>
        <div className="text-sm text-indigo-100">En ligne</div>
      </div>
    </div>
  );
};

export default NetworkStats;