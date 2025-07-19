import React, { useState } from 'react';
import {
  User,
  Camera,
  Edit3,
  Save,
  MapPin,
  Mail,
  Phone,
  Calendar,
  Briefcase,
  GraduationCap,
  Star,
  Award,
  Users,
  MessageSquare,
  Heart,
  Share2,
  Settings,
  Shield,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Plus,
  X
} from 'lucide-react';

const Profile = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    // Informations de base
    firstName: 'Aline',
    lastName: 'Mengue',
    email: 'aline.mengue@example.com',
    phone: '+241 XX XX XX XX',
    dateOfBirth: '1985-03-15',
    region: 'Estuaire',
    city: 'Libreville',
    address: 'Quartier Louis, Libreville',

    // Profil professionnel
    currentPosition: 'Présidente d\'ONG',
    organization: 'Femmes Leaders Gabon',
    bio: 'Militante associative depuis 15 ans, spécialisée dans l\'autonomisation économique des femmes. Passionnée par le développement local et l\'inclusion financière.',

    // Éducation et compétences
    educationLevel: 'Master',
    educationDetails: 'Master en Développement International - Université Omar Bongo\nLicence en Sciences Politiques - Université de Libreville',
    skills: ['Leadership', 'Gestion de projet', 'Communication', 'Négociation', 'Formation'],
    languages: ['Français (natif)', 'Fang (natif)', 'Anglais (intermédiaire)', 'Espagnol (notions)'],

    // Expérience politique
    politicalExperience: 'Expérimentée',
    politicalInterests: ['Gouvernance locale', 'Droits des femmes', 'Économie et emploi', 'Éducation'],
    politicalAchievements: 'Élue au conseil municipal de Libreville (2015-2020)\nPrésidente de l\'Association des Femmes Entrepreneurs (2018-2022)\nMembre du Comité National pour l\'Égalité des Genres',

    // Objectifs et aspirations
    careerGoals: 'Ambition de me présenter aux élections législatives en 2026 pour porter la voix des femmes entrepreneures au niveau national.',
    mentorshipStatus: 'Offre du mentorat',
    mentorshipAreas: ['Entrepreneuriat féminin', 'Leadership politique', 'Gestion d\'ONG'],

    // Réseaux sociaux
    website: 'https://femmes-leaders-gabon.org',
    linkedin: 'https://linkedin.com/in/aline-mengue',
    twitter: '@aline_mengue',
    facebook: 'https://facebook.com/aline.mengue.leader',

    // Paramètres de confidentialité
    isPublic: true,
    showContactInfo: false,
    showBirthDate: false
  });

  const [completionPercentage, setCompletionPercentage] = useState(85);

  const achievements = [
    { id: 1, title: 'Profil Vérifiée', description: 'Compte vérifié par l\'administration', icon: Shield, color: 'text-blue-600' },
    { id: 2, title: 'Mentore Active', description: '10 femmes accompagnées', icon: Users, color: 'text-green-600' },
    { id: 3, title: 'Contributrice Expert', description: '50+ messages dans les forums', icon: MessageSquare, color: 'text-purple-600' },
    { id: 4, title: 'Networkeuse', description: '100+ connexions établies', icon: Heart, color: 'text-pink-600' },
    { id: 5, title: 'Formatrice', description: '5 événements organisés', icon: Award, color: 'text-yellow-600' }
  ];

  const stats = [
    { label: 'Messages Forums', value: 47, icon: MessageSquare },
    { label: 'Événements Participés', value: 12, icon: Calendar },
    { label: 'Connexions', value: 156, icon: Users },
    { label: 'Mentorées', value: 8, icon: Star }
  ];

  const recentActivities = [
    { id: 1, type: 'forum', action: 'A publié dans "Gouvernance Locale"', time: '2h' },
    { id: 2, type: 'event', action: 'S\'est inscrite à "Formation Leadership"', time: '1j' },
    { id: 3, type: 'connection', action: 'S\'est connectée avec Betty Nzoghe', time: '2j' },
    { id: 4, type: 'mentoring', action: 'A commencé un mentorat avec Cécile O.', time: '3j' }
  ];

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArrayInputChange = (field, index, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const addArrayItem = (field) => {
    setProfileData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayItem = (field, index) => {
    setProfileData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const calculateCompletion = () => {
    let percentage = 0;
    const fields = [
      'firstName', 'lastName', 'email', 'phone', 'dateOfBirth', 'region', 'city',
      'currentPosition', 'organization', 'bio', 'educationLevel', 'politicalExperience'
    ];

    const filledFieldsCount = fields.filter(field => profileData[field] && profileData[field].trim() !== '').length;
    percentage = Math.round((filledFieldsCount / fields.length) * 100);

    // Bonus pour les champs optionnels
    if (profileData.skills.length > 0) percentage += 5;
    if (profileData.languages.length > 0) percentage += 5;
    if (profileData.politicalInterests.length > 0) percentage += 5;

    return Math.min(percentage, 100);
  };

  const saveProfile = () => {
    setIsEditing(false);
    setCompletionPercentage(calculateCompletion());
    // Ici on enverrait les données au backend
    console.log('Profil sauvegardé:', profileData);
  };

  return (
    <div className="space-y-6">
      {/* En-tête du profil */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white bg-opacity-10 rounded-full -translate-y-16 translate-x-16"></div>

        <div className="relative flex items-start space-x-6">
          <div className="relative">
            <div className="w-24 h-24 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              {/* This is a placeholder for a user avatar. You might replace it with an actual image later. */}
              <User className="w-12 h-12 text-white" />
            </div>
            <button className="absolute -bottom-2 -right-2 w-8 h-8 bg-white text-blue-600 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors">
              <Camera className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-2xl font-bold">{profileData.firstName} {profileData.lastName}</h1>
              <Shield className="w-6 h-6 text-green-400" title="Profil vérifié" />
            </div>

            <p className="text-blue-100 mb-2">{profileData.currentPosition} - {profileData.organization}</p>

            <div className="flex flex-wrap items-center gap-4 text-sm text-blue-200">
              <div className="flex items-center space-x-1">
                <MapPin className="w-4 h-4" />
                <span>{profileData.city}, {profileData.region}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>Membre depuis 2022</span> {/* This would ideally be dynamic */}
              </div>
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4" />
                <span>Niveau: {profileData.politicalExperience}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm text-blue-200">Profil complété</p>
              <p className="text-xl font-bold">{completionPercentage}%</p>
            </div>
            <div className="w-16 h-16 relative">
              <svg className="w-16 h-16 transform -rotate-90">
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="transparent"
                  className="text-blue-300"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="transparent"
                  strokeDasharray={`${(completionPercentage / 100) * (2 * Math.PI * 28)} ${2 * Math.PI * 28}`}
                  className="text-white"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-medium text-white">{completionPercentage}%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex space-x-2">
            {achievements.slice(0, 3).map(achievement => {
              const IconComponent = achievement.icon;
              return (
                <div key={achievement.id} className="flex items-center space-x-1 bg-white bg-opacity-20 px-2 py-1 rounded-full text-xs">
                  <IconComponent className="w-3 h-3" />
                  <span>{achievement.title}</span>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Edit3 className="w-4 h-4" />
            <span>{isEditing ? 'Annuler' : 'Modifier'}</span>
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Vue d\'ensemble', icon: User },
              { id: 'details', label: 'Informations détaillées', icon: Edit3 },
              { id: 'achievements', label: 'Réalisations', icon: Award },
              { id: 'activity', label: 'Activité', icon: MessageSquare },
              { id: 'privacy', label: 'Confidentialité', icon: Settings }
            ].map(tab => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Contenu des onglets */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Statistiques */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistiques</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.map((stat, index) => {
                  const IconComponent = stat.icon;
                  return (
                    <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
                      <IconComponent className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                      <p className="text-sm text-gray-600">{stat.label}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">À propos</h3>
              <p className="text-gray-700 leading-relaxed mb-4">{profileData.bio}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Briefcase className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">{profileData.currentPosition}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <GraduationCap className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">{profileData.educationLevel}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">{profileData.city}, {profileData.region}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Star className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Expérience: {profileData.politicalExperience}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Compétences</h3>
              <div className="flex flex-wrap gap-2">
                {profileData.skills.map((skill, index) => (
                  <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Réalisations</h3>
              <div className="space-y-3">
                {achievements.map(achievement => {
                  const IconComponent = achievement.icon;
                  return (
                    <div key={achievement.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <IconComponent className={`w-6 h-6 ${achievement.color}`} />
                      <div>
                        <p className="font-medium text-gray-900">{achievement.title}</p>
                        <p className="text-xs text-gray-600">{achievement.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Activité récente</h3>
              <div className="space-y-3">
                {recentActivities.map(activity => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm text-gray-900">{activity.action}</p>
                      <p className="text-xs text-gray-500">Il y a {activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'details' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Informations détaillées</h3>
            {isEditing && (
              <button
                onClick={saveProfile}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>Sauvegarder</span>
              </button>
            )}
          </div>

          <div className="space-y-8">
            {/* Informations personnelles */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4">Informations personnelles</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                  <input
                    id="firstName"
                    type="text"
                    value={profileData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                  <input
                    id="lastName"
                    type="text"
                    value={profileData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    id="email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                  <input
                    id="phone"
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
                <div>
                  <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-1">Date de naissance</label>
                  <input
                    id="dateOfBirth"
                    type="date"
                    value={profileData.dateOfBirth}
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
                <div>
                  <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-1">Région</label>
                  <input
                    id="region"
                    type="text"
                    value={profileData.region}
                    onChange={(e) => handleInputChange('region', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
                  <input
                    id="city"
                    type="text"
                    value={profileData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                  <input
                    id="address"
                    type="text"
                    value={profileData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
              </div>
            </div>

            {/* Profil professionnel */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4">Profil professionnel</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="currentPosition" className="block text-sm font-medium text-gray-700 mb-1">Poste actuel</label>
                  <input
                    id="currentPosition"
                    type="text"
                    value={profileData.currentPosition}
                    onChange={(e) => handleInputChange('currentPosition', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
                <div>
                  <label htmlFor="organization" className="block text-sm font-medium text-gray-700 mb-1">Organisation</label>
                  <input
                    id="organization"
                    type="text"
                    value={profileData.organization}
                    onChange={(e) => handleInputChange('organization', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">Biographie</label>
                <textarea
                  id="bio"
                  value={profileData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  disabled={!isEditing}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="Décrivez votre parcours et vos motivations..."
                />
              </div>
            </div>

            {/* Éducation et compétences */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4">Éducation et compétences</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="educationLevel" className="block text-sm font-medium text-gray-700 mb-1">Niveau d'éducation</label>
                  <input
                    id="educationLevel"
                    type="text"
                    value={profileData.educationLevel}
                    onChange={(e) => handleInputChange('educationLevel', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
                <div>
                  <label htmlFor="educationDetails" className="block text-sm font-medium text-gray-700 mb-1">Détails de l'éducation</label>
                  <textarea
                    id="educationDetails"
                    value={profileData.educationDetails}
                    onChange={(e) => handleInputChange('educationDetails', e.target.value)}
                    disabled={!isEditing}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                    placeholder="Ex: Master en..."
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Compétences</label>
                <div className="space-y-2">
                  {profileData.skills.map((skill, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={skill}
                        onChange={(e) => handleArrayInputChange('skills', index, e.target.value)}
                        disabled={!isEditing}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                      />
                      {isEditing && (
                        <button
                          onClick={() => removeArrayItem('skills', index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  {isEditing && (
                    <button
                      onClick={() => addArrayItem('skills')}
                      className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Ajouter une compétence</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Langues</label>
                <div className="space-y-2">
                  {profileData.languages.map((language, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={language}
                        onChange={(e) => handleArrayInputChange('languages', index, e.target.value)}
                        disabled={!isEditing}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                      />
                      {isEditing && (
                        <button
                          onClick={() => removeArrayItem('languages', index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  {isEditing && (
                    <button
                      onClick={() => addArrayItem('languages')}
                      className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Ajouter une langue</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Expérience politique */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4">Expérience politique</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="politicalExperience" className="block text-sm font-medium text-gray-700 mb-1">Niveau d'expérience</label>
                  <select
                    id="politicalExperience"
                    value={profileData.politicalExperience}
                    onChange={(e) => handleInputChange('politicalExperience', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                  >
                    <option value="none">Aucune expérience</option>
                    <option value="beginner">Débutante</option>
                    <option value="intermediate">Intermédiaire</option>
                    <option value="experienced">Expérimentée</option>
                  </select>
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Centres d'intérêt politiques</label>
                <div className="space-y-2">
                  {profileData.politicalInterests.map((interest, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={interest}
                        onChange={(e) => handleArrayInputChange('politicalInterests', index, e.target.value)}
                        disabled={!isEditing}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                      />
                      {isEditing && (
                        <button
                          onClick={() => removeArrayItem('politicalInterests', index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  {isEditing && (
                    <button
                      onClick={() => addArrayItem('politicalInterests')}
                      className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Ajouter un intérêt</span>
                    </button>
                  )}
                </div>
              </div>
              <div className="mt-4">
                <label htmlFor="politicalAchievements" className="block text-sm font-medium text-gray-700 mb-1">Réalisations politiques</label>
                <textarea
                  id="politicalAchievements"
                  value={profileData.politicalAchievements}
                  onChange={(e) => handleInputChange('politicalAchievements', e.target.value)}
                  disabled={!isEditing}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="Décrivez vos réalisations..."
                />
              </div>
            </div>

            {/* Objectifs et aspirations */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4">Objectifs et aspirations</h4>
              <div>
                <label htmlFor="careerGoals" className="block text-sm font-medium text-gray-700 mb-1">Objectifs de carrière</label>
                <textarea
                  id="careerGoals"
                  value={profileData.careerGoals}
                  onChange={(e) => handleInputChange('careerGoals', e.target.value)}
                  disabled={!isEditing}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="Décrivez vos objectifs de carrière..."
                />
              </div>
              <div className="mt-4">
                <label htmlFor="mentorshipStatus" className="block text-sm font-medium text-gray-700 mb-1">Statut de mentorat</label>
                <select
                  id="mentorshipStatus"
                  value={profileData.mentorshipStatus}
                  onChange={(e) => handleInputChange('mentorshipStatus', e.target.value)}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                >
                  <option value="none">Ne pas participer</option>
                  <option value="seeking">Recherche de mentorat</option>
                  <option value="offering">Offre du mentorat</option>
                </select>
              </div>
              {profileData.mentorshipStatus === 'offering' && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Domaines de mentorat</label>
                  <div className="space-y-2">
                    {profileData.mentorshipAreas.map((area, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={area}
                          onChange={(e) => handleArrayInputChange('mentorshipAreas', index, e.target.value)}
                          disabled={!isEditing}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                        />
                        {isEditing && (
                          <button
                            onClick={() => removeArrayItem('mentorshipAreas', index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    {isEditing && (
                      <button
                        onClick={() => addArrayItem('mentorshipAreas')}
                        className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Ajouter un domaine</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Réseaux sociaux */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4">Réseaux sociaux</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">Site web</label>
                  <input
                    id="website"
                    type="url"
                    value={profileData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                    placeholder="https://votre-site.com"
                  />
                </div>
                <div>
                  <label htmlFor="linkedin" className="block text-sm font-medium text-gray-700 mb-1">LinkedIn</label>
                  <input
                    id="linkedin"
                    type="url"
                    value={profileData.linkedin}
                    onChange={(e) => handleInputChange('linkedin', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                    placeholder="https://linkedin.com/in/votre-profil"
                  />
                </div>
                <div>
                  <label htmlFor="twitter" className="block text-sm font-medium text-gray-700 mb-1">Twitter</label>
                  <input
                    id="twitter"
                    type="text"
                    value={profileData.twitter}
                    onChange={(e) => handleInputChange('twitter', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                    placeholder="@votre_pseudo"
                  />
                </div>
                <div>
                  <label htmlFor="facebook" className="block text-sm font-medium text-gray-700 mb-1">Facebook</label>
                  <input
                    id="facebook"
                    type="url"
                    value={profileData.facebook}
                    onChange={(e) => handleInputChange('facebook', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                    placeholder="https://facebook.com/votre.profil"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'achievements' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {achievements.map(achievement => {
            const IconComponent = achievement.icon;
            return (
              <div key={achievement.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
                <IconComponent className={`w-12 h-12 ${achievement.color} mx-auto mb-4`} />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{achievement.title}</h3>
                <p className="text-sm text-gray-600">{achievement.description}</p>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Activité récente</h3>
          <div className="space-y-4">
            {recentActivities.length > 0 ? (
              recentActivities.map(activity => (
                <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  {activity.type === 'forum' && <MessageSquare className="w-5 h-5 text-blue-600 flex-shrink-0" />}
                  {activity.type === 'event' && <Calendar className="w-5 h-5 text-green-600 flex-shrink-0" />}
                  {activity.type === 'connection' && <Users className="w-5 h-5 text-purple-600 flex-shrink-0" />}
                  {activity.type === 'mentoring' && <Star className="w-5 h-5 text-yellow-600 flex-shrink-0" />}
                  <div>
                    <p className="text-sm text-gray-900 font-medium">{activity.action}</p>
                    <p className="text-xs text-gray-500">Il y a {activity.time}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500">Aucune activité récente à afficher.</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'privacy' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Paramètres de confidentialité</h3>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-md font-medium text-gray-900">Profil public</h4>
                <p className="text-sm text-gray-600">Permettre aux autres membres de voir votre profil</p>
              </div>
              <button
                onClick={() => handleInputChange('isPublic', !profileData.isPublic)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  profileData.isPublic ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    profileData.isPublic ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-md font-medium text-gray-900">Afficher les informations de contact</h4>
                <p className="text-sm text-gray-600">Permettre aux autres de voir votre email et téléphone</p>
              </div>
              <button
                onClick={() => handleInputChange('showContactInfo', !profileData.showContactInfo)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  profileData.showContactInfo ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    profileData.showContactInfo ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-md font-medium text-gray-900">Afficher la date de naissance</h4>
                <p className="text-sm text-gray-600">Permettre aux autres de voir votre âge</p>
              </div>
              <button
                onClick={() => handleInputChange('showBirthDate', !profileData.showBirthDate)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  profileData.showBirthDate ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    profileData.showBirthDate ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-yellow-800">Information importante</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    Votre profil public aide à créer des connexions et des opportunités de collaboration.
                    Nous recommandons de garder votre profil visible pour maximiser votre impact.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;