import { useEffect, useState } from 'react';
import { getApiClient } from '../lib/apiClient';
import { buildDemoAnalyticsSnapshot } from '../lib/demoAnalyticsData';

export function useAnalyticsSnapshot() {
  const [snapshot, setSnapshot] = useState(() => buildDemoAnalyticsSnapshot());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchSnapshot = async () => {
      try {
        setLoading(true);
        setError(null);
        const client = getApiClient();
        const response = await client.analytics('engine').catch(() => null);
        if (!isMounted) return;
        const payload = response?.data || response || buildDemoAnalyticsSnapshot();
        setSnapshot(payload);
      } catch (err) {
        if (!isMounted) return;
        setSnapshot(buildDemoAnalyticsSnapshot());
        setError(err.message || 'Failed to load analytics snapshot');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchSnapshot();
    return () => {
      isMounted = false;
    };
  }, []);

  return { snapshot, loading, error };
}

export default useAnalyticsSnapshot;
