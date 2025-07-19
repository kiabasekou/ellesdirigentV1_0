// src/components/dashboard/ProgressChart.js
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const monthlyData = [
  { month: 'Jan', discussions: 4, events: 2, resources: 3 },
  { month: 'Fév', discussions: 8, events: 3, resources: 5 },
  { month: 'Mar', discussions: 12, events: 4, resources: 7 },
  { month: 'Avr', discussions: 16, events: 6, resources: 9 },
  { month: 'Mai', discussions: 23, events: 7, resources: 12 }
];

const profileCompletion = [
  { category: 'Informations personnelles', completion: 100 },
  { category: 'Expérience professionnelle', completion: 80 },
  { category: 'Intérêts politiques', completion: 90 },
  { category: 'Compétences', completion: 70 },
  { category: 'Formation', completion: 60 }
];

const ProgressChart = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Votre progression</h3>
        <p className="text-sm text-gray-500 mt-1">Évolution de votre activité sur la plateforme</p>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Activité mensuelle */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-4">Activité mensuelle</h4>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="discussions" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="Discussions"
                />
                <Line 
                  type="monotone" 
                  dataKey="events" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Événements"
                />
                <Line 
                  type="monotone" 
                  dataKey="resources" 
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  name="Ressources"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
           {/* Completion du profil */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-4">Completion du profil</h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={profileCompletion} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis dataKey="category" type="category" width={120} fontSize={10} />
                <Tooltip />
                <Bar dataKey="completion" fill="#ec4899" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressChart;
