import { useEffect, useState } from 'react';

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
          throw new Error('Failed to fetch dashboard metrics');
        }
        
        const data = await response.json();
        
        if (!isMounted) return;
        
        // Transform the metrics data into the expected snapshot format
        const snapshot = {
          summary: {
            totalRevenue: data.data?.modules?.finance?.metrics?.totalRevenue || 0,
            totalOrders: 0,
            totalPipelineValue: 0,
            warehouseHealth: 0
          },
          modules: {
            sales: { name: 'Sales', score: 70, metrics: { revenue: 0, orders: 0, averageOrderValue: 0 } },
            crm: { name: 'CRM', score: 62, metrics: { leads: 0, opportunities: 0, pipelineValue: 0 } },
            purchase: { name: 'Purchase', score: 58, metrics: { vendors: 0, onTimePct: 0, avgQtyAccuracy: 0 } },
            warehouse: { name: 'Warehouse', score: 65, metrics: { readyToPick: 0, packedCount: 0, shipmentsInTransit: 0 } },
            finance: {
              name: 'Finance',
              score: data.data?.modules?.finance?.score || 75,
              metrics: data.data?.modules?.finance?.metrics || { totalReceivable: 0, totalPayable: 0, totalRevenue: 0, totalExpense: 0, netProfit: 0, margin: 0 },
              breakdown: data.data?.modules?.finance?.breakdown || [],
              chartData: data.data?.modules?.finance?.chartData || []
            }
          },
          insights: data.data?.insights || []
        };
        
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
