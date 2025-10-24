import { useState, useEffect } from 'react';

export interface EventStats {
  totalEvents: number;
  activeEvents: number;
  inactiveEvents: number;
  totalSessions: number;
  totalOrganizers: number;
  eventsWithSessions: number;
  eventsWithAttendance: number;
  eventsWithoutSessions: number;
  eventsWithoutAttendance: number;
}

export interface UseEventStatsReturn {
  stats: EventStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook to fetch event statistics
 */
export function useEventStats(): UseEventStatsReturn {
  const [stats, setStats] = useState<EventStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/events/stats');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch event statistics: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
      } else {
        throw new Error(data.error || 'Failed to fetch event statistics');
      }
    } catch (err) {
      console.error('Error fetching event statistics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch event statistics');
    } finally {
      setLoading(false);
    }
  };

  const refetch = async () => {
    await fetchStats();
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats,
    loading,
    error,
    refetch,
  };
}
