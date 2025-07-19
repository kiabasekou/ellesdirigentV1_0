import { useState, useCallback } from 'react';
import { statsService } from '../services/statsService';

export const useStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const [overview, members, events, forums, resources] = await Promise.all([
        statsService.getOverviewStats(params),
        statsService.getMemberStats(params),
        statsService.getEventStats(params),
        statsService.getForumStats(params),
        statsService.getResourceStats(params)
      ]);

      const combinedStats = {
        overview: overview.data || overview,
        membersByRegion: members.by_region || [],
        membersByExperience: members.by_experience || [],
        activityTrend: members.activity_trend || {},
        engagementMetrics: {
          forumEngagement: forums.engagement || {},
          eventEngagement: events.engagement || {},
          resourceEngagement: resources.engagement || {}
        },
        topPerformers: members.top_performers || []
      };

      setStats(combinedStats);
      return combinedStats;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const exportReport = async (params = {}) => {
    try {
      const blob = await statsService.exportReport(params);
      return blob;
    } catch (err) {
      throw new Error('Erreur lors de l\'export du rapport');
    }
  };

  return {
    stats,
    loading,
    error,
    fetchStats,
    exportReport
  };
};