// ============================================================================
// frontend/src/pages/admin/Dashboard.js - CORRECTION
// ============================================================================

/**
 * Dashboard administrateur avec statistiques et gestion
 * Affiche les métriques clés et les actions rapides
 */
import React, { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  TrendingUp,
  FileText,
  Calendar,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  Activity,
  BarChart3,
  Globe,
  Shield
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
// Importe adminAPI et generalAPI depuis le fichier api.js centralisé
import { adminAPI, generalAPI } from '../../api'; // Assurez-vous que le chemin est correct
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Enregistrer les composants Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    users: {
      total: 0,
      validated: 0,
      pending: 0,
      rejected: 0,
      growth: 0
    },
    activity: {
      dailyActive: 0,
      weeklyActive: 0,
      monthlyActive: 0
    },
    content: {
      forums: 0,
      events: 0,
      resources: 0
    },
    regions: []
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        const [statsRes, pendingRes, activitiesRes] = await Promise.all([
          generalAPI.getStats(), // Appel à l'API générale pour les statistiques
          adminAPI.getPendingUsers(5), // Appel à l'API admin pour les utilisateurs en attente
          adminAPI.getRecentActivities(10) // Appel à l'API admin pour les activités récentes
        ]);

        // Mise à jour de l'état avec les données récupérées
        setStats(statsRes.data);
        setPendingUsers(pendingRes.data);
        // CORRECTION: Utiliser setRecentActivities au lieu de setActivities
        setRecentActivities(activitiesRes.data);

      } catch (error) {
        console.error('Erreur lors du chargement du dashboard:', error);
        // Vous pouvez ajouter une gestion d'erreur visible pour l'utilisateur ici
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []); // Le tableau de dépendances est vide car ce useEffect ne doit s'exécuter qu'une fois au montage.

  // Configuration des graphiques (les données sont des exemples, elles devraient venir de l'API si disponibles)
  const registrationChartData = {
    labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'],
    datasets: [
      {
        label: 'Nouvelles inscriptions',
        data: [12, 19, 23, 25, 32, 45], // Exemple de données
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Comptes validés',
        data: [10, 15, 20, 22, 28, 40], // Exemple de données
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  };

  const regionChartData = {
    labels: stats.regions.map(r => r.name),
    datasets: [
      {
        data: stats.regions.map(r => r.count),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(251, 146, 60, 0.8)',
          'rgba(147, 51, 234, 0.8)',
          'rgba(236, 72, 153, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(251, 191, 36, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(99, 102, 241, 0.8)'
        ],
        borderWidth: 0
      }
    ]
  };

  const activityChartData = {
    labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
    datasets: [
      {
        label: 'Utilisateurs actifs',
        data: [120, 150, 180, 165, 190, 145, 130], // Exemple de données
        backgroundColor: 'rgba(147, 51, 234, 0.8)',
        borderRadius: 8
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom'
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* En-tête */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Dashboard Administrateur</h1>
        <p className="text-blue-100">
          Vue d'ensemble de la plateforme Femmes en Politique
        </p>
        <div className="mt-4 flex items-center space-x-2 text-sm">
          <Activity className="w-4 h-4" />
          <span>Dernière mise à jour: {new Date().toLocaleString('fr-FR')}</span>
        </div>
      </div>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total utilisatrices</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.users.total}</p>
              <p className="text-sm text-green-600 mt-2 flex items-center">
                <TrendingUp className="w-4 h-4 mr-1" />
                +{stats.users.growth}% ce mois
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Comptes validés</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.users.validated}</p>
              <p className="text-sm text-gray-500 mt-2">
                {Math.round((stats.users.validated / stats.users.total) * 100)}% du total
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">En attente</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.users.pending}</p>
              <button
                onClick={() => navigate('/admin/participants/pending')}
                className="text-sm text-blue-600 hover:text-blue-700 mt-2"
              >
                Voir les demandes →
              </button>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Utilisatrices actives</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.activity.dailyActive}</p>
              <p className="text-sm text-gray-500 mt-2">Aujourd'hui</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Évolution des inscriptions</h3>
          <div className="h-64">
            <Line data={registrationChartData} options={chartOptions} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Répartition par région</h3>
          <div className="h-64">
            <Doughnut data={regionChartData} options={{...chartOptions, maintainAspectRatio: true}} />
          </div>
        </div>
      </div>

      {/* Demandes en attente et activité récente */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Demandes en attente */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Demandes en attente</h3>
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                {stats.users.pending}
              </span>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {pendingUsers.length > 0 ? (
              pendingUsers.map((user) => (
                <div key={user.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-medium">
                          {user.first_name?.[0]}{user.last_name?.[0]} {/* Ajout de ? pour éviter les erreurs si null */}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {user.first_name} {user.last_name}
                        </p>
                        <p className="text-sm text-gray-500">{user.region} • {user.ville}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate(`/admin/participants/${user.id}`)}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      Examiner
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                <p>Aucune demande en attente</p>
              </div>
            )}
          </div>
          {pendingUsers.length > 0 && (
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={() => navigate('/admin/participants/pending')}
                className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Voir toutes les demandes ({stats.users.pending})
              </button>
            </div>
          )}
        </div>

        {/* Activité récente */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Activité récente</h3>
          </div>
          <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {recentActivities.map((activity, index) => (
              <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start space-x-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    activity.type === 'registration' ? 'bg-blue-500' :
                    activity.type === 'validation' ? 'bg-green-500' :
                    activity.type === 'forum' ? 'bg-purple-500' :
                    'bg-gray-500'
                  }`}></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{activity.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(activity.timestamp).toLocaleString('fr-FR')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Graphique d'activité */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Activité hebdomadaire</h3>
        <div className="h-64">
          <Bar data={activityChartData} options={chartOptions} />
        </div>
      </div>

      {/* Actions rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button
          onClick={() => navigate('/admin/participants/pending')}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
        >
          <Clock className="w-8 h-8 text-yellow-600 mb-3" />
          <h3 className="font-semibold text-gray-900">Gérer les demandes</h3>
          <p className="text-sm text-gray-600 mt-1">
            {stats.users.pending} demandes en attente de validation
          </p>
        </button>

        <button
          onClick={() => navigate('/admin/reports')}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
        >
          <BarChart3 className="w-8 h-8 text-blue-600 mb-3" />
          <h3 className="font-semibold text-gray-900">Générer des rapports</h3>
          <p className="text-sm text-gray-600 mt-1">
            Statistiques détaillées et exports
          </p>
        </button>

        <button
          onClick={() => navigate('/admin/settings')}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
        >
          <Shield className="w-8 h-8 text-purple-600 mb-3" />
          <h3 className="font-semibold text-gray-900">Paramètres système</h3>
          <p className="text-sm text-gray-600 mt-1">
            Configuration et sécurité
          </p>
        </button>
      </div>
    </div>
  );
};

export default AdminDashboard;
