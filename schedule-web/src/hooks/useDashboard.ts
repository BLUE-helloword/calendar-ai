import { useState, useEffect, useCallback } from 'react';
import { dashboardApi } from '../api/dashboard';
import type { DashboardVO } from '../types/dashboard';

export function useDashboard() {
  const [data, setData] = useState<DashboardVO | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await dashboardApi.overview();
      setData(res);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  return { data, loading, refresh: fetchDashboard };
}
