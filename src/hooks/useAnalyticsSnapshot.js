import { useEffect, useState } from 'react';
import { getApiClient } from '../lib/apiClient';

export function useAnalyticsSnapshot() {
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    let timer = null;

    const fetchSnapshot = async () => {
      try {
        setLoading(true);
        setError(null);
        const client = getApiClient();
        const response = await client.analytics('engine').catch(() => null);
        if (!isMounted) return;
        const payload = response?.data || response || null;
        // Handle both direct response and wrapped response formats
        const snapshot = payload?.data || payload;
        if (!snapshot || typeof snapshot !== 'object' || !snapshot.summary) {
          throw new Error('Analytics snapshot unavailable');
        }
        setSnapshot(snapshot);
      } catch (err) {
        if (!isMounted) return;
        setSnapshot(null);
        setError(err?.message || 'Failed to load analytics snapshot');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchSnapshot();
    timer = window.setInterval(() => {
      fetchSnapshot();
    }, 30000);

    return () => {
      isMounted = false;
      if (timer) window.clearInterval(timer);
    };
  }, []);

  return { snapshot, loading, error };
}

export default useAnalyticsSnapshot;
