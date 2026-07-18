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
        const response = await fetch(`${API_BASE}/dashboard/metrics?tenant_id=tenant_default`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard metrics');
        }
        
        const data = await response.json();
        
        if (!isMounted) return;
        
        // Transform the metrics data into the expected snapshot format
        const snapshot = {
          summary: {
            totalRevenue: data.data?.revenue || 0,
            totalOrders: data.data?.orders || 0,
            totalPipelineValue: data.data?.pipelineValue || 0,
            warehouseHealth: data.data?.warehouseReadyToPick || 0
          },
          modules: {
            sales: {
              name: 'Sales',
              score: data.data?.salesScore || 70,
              metrics: {
                revenue: data.data?.revenue || 0,
                orders: data.data?.orders || 0,
                averageOrderValue: data.data?.orders > 0 ? data.data.revenue / data.data.orders : 0
              }
            },
            crm: {
              name: 'CRM',
              score: data.data?.crmScore || 62,
              metrics: {
                leads: 0,
                opportunities: 0,
                pipelineValue: data.data?.pipelineValue || 0
              }
            },
            purchase: {
              name: 'Purchase',
              score: data.data?.purchaseScore || 58,
              metrics: {
                vendors: 0,
                onTimePct: 0,
                avgQtyAccuracy: 0
              }
            },
            warehouse: {
              name: 'Warehouse',
              score: data.data?.warehouseScore || 65,
              metrics: {
                readyToPick: data.data?.warehouseReadyToPick || 0,
                packedCount: 0,
                shipmentsInTransit: 0
              }
            },
            finance: {
              name: 'Finance',
              score: data.data?.financeScore || 72,
              metrics: {
                totalReceivable: data.data?.receivables || 0,
                totalPayable: data.data?.payables || 0,
                margin: 0
              }
            }
          }
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
