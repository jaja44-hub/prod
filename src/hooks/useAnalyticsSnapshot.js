import { useEffect, useState } from 'react';

/**
 * Live analytics snapshot hook (S5).
 * Sources the real KPI snapshot from /api/analytics/snapshot — which computes
 * every module's metrics + scores from the live Neon pools (sales/CRM/finance/
 * purchase/warehouse/HR). No hardcoded fallback metrics or scores on the client.
 */
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

        const API_BASE = process.env.REACT_APP_API_BASE || (window.location.hostname === 'localhost' ? 'http://localhost:3001/api' : '/api');
        const response = await fetch(`${API_BASE}/analytics/snapshot?tenant_id=tenant_default`);

        if (!response.ok) {
          throw new Error('Failed to fetch analytics snapshot');
        }

        const json = await response.json();

        if (!isMounted) return;

        const data = json.data || json || {};
        setSnapshot({
          summary: data.summary || {},
          modules: data.modules || {},
          insights: data.insights || [],
          generatedAt: data.generatedAt,
        });
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
