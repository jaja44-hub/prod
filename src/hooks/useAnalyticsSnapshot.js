import { useEffect, useState } from 'react';
import { getApiClient } from '../lib/apiClient';

export function useAnalyticsSnapshot() {
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchSnapshot = async () => {
      try {
        setLoading(true);
        setError(null);
        const client = getApiClient();
        const response = await client.analytics('engine');
        if (!isMounted) return;
        setSnapshot(response?.data || response || null);
      } catch (err) {
        if (!isMounted) return;
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
