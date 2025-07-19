import React, { useState, useEffect } from 'react';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { useSelector } from 'react-redux';

const Dashboard = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const user = useSelector((state) => state.auth.user);
  const statutValidation = user?.statut_validation || 'inconnu';

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-6 animate-fade-in p-6">
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-xl p-6 text-white relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center space-x-2 mb-2">
            <SparklesIcon className="w-6 h-6" />
            <span className={`text-sm font-medium px-3 py-1 rounded-full ${
              statutValidation === 'validee'
                ? 'bg-green-600 text-white'
                : statutValidation === 'rejetee'
                ? 'bg-red-600 text-white'
                : 'bg-yellow-400 text-white'
            }`}>
              {statutValidation === 'validee' && '✔ Validée'}
              {statutValidation === 'rejetee' && '❌ Rejetée'}
              {statutValidation === 'en_attente' && '⏳ En attente'}
            </span>
          </div>
          <h1 className="text-2xl font-bold mb-1">Bonjour, {user?.first_name || 'Invitée'} ! 👋</h1>
          <p className="text-blue-100">Bienvenue sur votre plateforme de développement politique</p>
          <p className="text-blue-200 text-sm mt-2">
            {currentTime.toLocaleDateString('fr-FR', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            })}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;