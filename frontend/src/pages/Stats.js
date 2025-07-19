/**
 * Page Statistiques - Tableaux de bord et analyses
 * Visualisation des données, rapports et métriques de performance
 */
import React, { useState, useEffect } from 'react';
import { 
  BarChart3,
  TrendingUp,
  Users,
  Calendar,
  Download,
  Filter,
  PieChart,
  Activity,
  Target,
  Award,
  MapPin,
  Clock,
  Eye,
  MessageSquare,
  FileText,
  Share2,
  ChevronUp,
  ChevronDown,
  Info,
  Loader
} from 'lucide-react';
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
import { Line, Bar, Doughnut, Pie } from 'react-chartjs-2';
import { statsService } from '../services/statsService';
import { useStats } from '../hooks/useStats';
import { toast } from '../components/Toast';
import StatsOverview from '../components/stats/StatsOverview';
import ActivityChart from '../components/stats/ActivityChart';
import RegionalMap from '../components/stats/RegionalMap';
import EngagementMetrics from '../components/stats/EngagementMetrics';
import ExportReport from '../components/stats/ExportReport';

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

const Stats = () => {
  const { stats, loading, error, fetchStats, exportReport } = useStats();
  
  const [selectedPeriod, setSelectedPeriod] = useState('month'); // 'week' | 'month' | 'quarter' | 'year'
  const [selectedMetric, setSelectedMetric] = useState('all'); // 'all' | 'engagement' | 'growth' | 'activity'
  const [showFilters, setShowFilters] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  // Périodes disponibles
  const periods = [
    { value: 'week', label: 'Cette semaine' },
    { value: 'month', label: 'Ce mois' },
    { value: 'quarter', label: 'Ce trimestre' },
    { value: 'year', label: 'Cette année' }
  ];

  // Données de démonstration
  const demoStats = {
    overview: {
      totalMembers: 1234,
      activeMembersRate: 78,
      newMembersThisMonth: 89,
      growthRate: 12.5,
      totalEvents: 45,
      eventsAttendance: 892,
      forumPosts: 2341,
      resourcesDownloaded: 3456
    },
    membersByRegion: [
      { region: 'Estuaire', count: 456, percentage: 37 },
      { region: 'Haut-Ogooué', count: 234, percentage: 19 },
      { region: 'Moyen-Ogooué', count: 178, percentage: 14 },
      { region: 'Ngounié', count: 123, percentage: 10 },
      { region: 'Woleu-Ntem', count: 98, percentage: 8 },
      { region: 'Autres', count: 145, percentage: 12 }
    ],
    membersByExperience: [
      { level: 'Aucune', count: 345, percentage: 28 },
      { level: 'Locale', count: 456, percentage: 37 },
      { level: 'Régionale', count: 312, percentage: 25 },
      { level: 'Nationale', count: 121, percentage: 10 }
    ],
    activityTrend: {
      labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'],
      datasets: [
        {
          label: 'Nouvelles inscriptions',
          data: [65, 78, 90, 81, 86, 89],
          borderColor: 'rgb(99, 102, 241)',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          tension: 0.4
        },
        {
          label: 'Participations événements',
          data: [120, 135, 155, 142, 168, 175],
          borderColor: 'rgb(168, 85, 247)',
          backgroundColor: 'rgba(168, 85, 247, 0.1)',
          tension: 0.4
        }
      ]
    },
    engagementMetrics: {
      forumEngagement: {
        posts: 342,
        replies: 1234,
        activeUsers: 234,
        avgPostsPerUser: 3.4
      },
      eventEngagement: {
        totalRegistrations: 892,
        attendanceRate: 76,
        satisfactionScore: 4.6,
        recurringAttendees: 234
      },
      resourceEngagement: {
        downloads: 3456,
        uploads: 123,
        avgRating: 4.3,
        topCategories: ['Guides', 'Formations', 'Modèles']
      }
    },
    topPerformers: [
      { name: 'Marie Nguema', score: 98, avatar: null, region: 'Estuaire' },
      { name: 'Jeanne Mbadinga', score: 92, avatar: null, region: 'Haut-Ogooué' },
      { name: 'Sylvie Oyono', score: 87, avatar: null, region: 'Woleu-Ntem' },
      { name: 'Alice Nze', score: 84, avatar: null, region: 'Ngounié' },
      { name: 'Claire Obame', score: 81, avatar: null, region: 'Moyen-Ogooué' }
    ]
  };

  useEffect(() => {
    loadStats();
  }, [selectedPeriod, selectedMetric]);

  const loadStats = async () => {
    try {
      await fetchStats({
        period: selectedPeriod,
        metric: selectedMetric
      });
    } catch (error) {
      console.error('Erreur chargement statistiques:', error);
    }
  };

  const handleExport = async (format) => {
    setExportLoading(true);
    try {
      const report = await exportReport({
        period: selectedPeriod,
        format: format // 'pdf' | 'excel' | 'csv'
      });
      
      // Télécharger le fichier
      const url = window.URL.createObjectURL(new Blob([report]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `rapport-statistiques-${selectedPeriod}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Rapport exporté avec succès');
    } catch (error) {
      toast.error('Erreur lors de l\'export du rapport');
    } finally {
      setExportLoading(false);
    }
  };

  const currentStats = stats || demoStats;

  // Configuration des graphiques
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        cornerRadius: 8,
        titleSpacing: 8,
        displayColors: true
      }
    }
  };

  const regionChartData = {
    labels: currentStats.membersByRegion.map(r => r.region),
    datasets: [{
      data: currentStats.membersByRegion.map(r => r.count),
      backgroundColor: [
        'rgba(99, 102, 241, 0.8)',
        'rgba(168, 85, 247, 0.8)',
        'rgba(236, 72, 153, 0.8)',
        'rgba(34, 197, 94, 0.8)',
        'rgba(251, 146, 60, 0.8)',
        'rgba(156, 163, 175, 0.8)'
      ],
      borderWidth: 0
    }]
  };

  const experienceChartData = {
    labels: currentStats.membersByExperience.map(e => e.level),
    datasets: [{
      label: 'Membres',
      data: currentStats.membersByExperience.map(e => e.count),
      backgroundColor: 'rgba(99, 102, 241, 0.8)',
      borderColor: 'rgba(99, 102, 241, 1)',
      borderWidth: 1
    }]
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* En-tête */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl p-8 text-white mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl font-bold mb-4">Tableau de Bord & Statistiques</h1>
            <p className="text-blue-100">
              Suivez les performances et l'évolution de la plateforme avec des données en temps réel
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg text-white border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
            >
              {periods.map(period => (
                <option key={period.value} value={period.value} className="text-gray-900">
                  {period.label}
                </option>
              ))}
            </select>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors flex items-center justify-center"
            >
              <Filter className="w-5 h-5 mr-2" />
              Filtres
            </button>

            <ExportReport
              onExport={handleExport}
              loading={exportLoading}
            />
          </div>
        </div>

        {/* Vue d'ensemble rapide */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <Users className="w-6 h-6 mb-2" />
            <div className="text-2xl font-bold">{currentStats.overview.totalMembers}</div>
            <div className="text-sm text-blue-100">Membres actives</div>
            <div className="flex items-center mt-1 text-xs">
              {currentStats.overview.growthRate > 0 ? (
                <>
                  <ChevronUp className="w-3 h-3 mr-1" />
                  <span className="text-green-300">+{currentStats.overview.growthRate}%</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3 mr-1" />
                  <span className="text-red-300">{currentStats.overview.growthRate}%</span>
                </>
              )}
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <Calendar className="w-6 h-6 mb-2" />
            <div className="text-2xl font-bold">{currentStats.overview.totalEvents}</div>
            <div className="text-sm text-blue-100">Événements</div>
            <div className="text-xs text-blue-200 mt-1">
              {currentStats.overview.eventsAttendance} participations
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <MessageSquare className="w-6 h-6 mb-2" />
            <div className="text-2xl font-bold">{currentStats.overview.forumPosts}</div>
            <div className="text-sm text-blue-100">Posts forum</div>
            <div className="text-xs text-blue-200 mt-1">
              {currentStats.overview.activeMembersRate}% actives
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <FileText className="w-6 h-6 mb-2" />
            <div className="text-2xl font-bold">{currentStats.overview.resourcesDownloaded}</div>
            <div className="text-sm text-blue-100">Téléchargements</div>
            <div className="text-xs text-blue-200 mt-1">
              +{currentStats.overview.newMembersThisMonth} ce mois
            </div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      {showFilters && (
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Métrique
              </label>
              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Toutes les métriques</option>
                <option value="engagement">Engagement</option>
                <option value="growth">Croissance</option>
                <option value="activity">Activité</option>
              </select>
            </div>

            <div className="flex items-end">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={compareMode}
                  onChange={(e) => setCompareMode(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Mode comparaison</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Grille de statistiques */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Répartition par région */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Répartition par région</h2>
            <MapPin className="w-5 h-5 text-gray-400" />
          </div>
          <div className="h-64">
            <Doughnut data={regionChartData} options={chartOptions} />
          </div>
          <div className="mt-4 space-y-2">
            {currentStats.membersByRegion.slice(0, 3).map((region, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{region.region}</span>
                <span className="font-medium">{region.percentage}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Niveau d'expérience */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Niveau d'expérience</h2>
            <Award className="w-5 h-5 text-gray-400" />
          </div>
          <div className="h-64">
            <Bar 
              data={experienceChartData} 
              options={{
                ...chartOptions,
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: {
                      display: false
                    }
                  },
                  x: {
                    grid: {
                      display: false
                    }
                  }
                }
              }} 
            />
          </div>
        </div>

        {/* Top performeuses */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Top performeuses</h2>
            <TrendingUp className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {currentStats.topPerformers.map((performer, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white font-bold">
                    {performer.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{performer.name}</p>
                    <p className="text-xs text-gray-500">{performer.region}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                      style={{ width: `${performer.score}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{performer.score}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Graphique d'évolution */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Évolution de l'activité</h2>
          <Activity className="w-5 h-5 text-gray-400" />
        </div>
        <div className="h-80">
          <Line 
            data={currentStats.activityTrend} 
            options={{
              ...chartOptions,
              scales: {
                y: {
                  beginAtZero: true,
                  grid: {
                    color: 'rgba(0, 0, 0, 0.05)'
                  }
                },
                x: {
                  grid: {
                    display: false
                  }
                }
              }
            }} 
          />
        </div>
      </div>

      {/* Métriques d'engagement */}
      <EngagementMetrics metrics={currentStats.engagementMetrics} />
    </div>
  );
};

export default Stats;