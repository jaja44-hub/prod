import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';
import PageCard from '../components/PageCard';
import DataTable from '../components/DataTable';
import BackendStatusBanner from '../components/BackendStatusBanner';
import { formatEtb } from '../lib/formatEtb';

export default function CashFlowForecast() {
  const { currentUser, loading: authLoading } = useAuth();
  const [forecastData, setForecastData] = useState([]);
  const [totals, setTotals] = useState({ inflow: 0, outflow: 0, net: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    async function loadForecast() {
      setLoading(true);
      setError('');
      try {
        const { getApiClient } = await import('../lib/apiClient.js');
        const client = getApiClient();
        const result = await client
          .get('/api/finance/forecast', { service: 'finance' })
          .catch((e) => {
            console.error('Cash-flow forecast fetch error:', e);
            return null;
          });
        if (!mounted) return;
        if (result?.data?.forecast) {
          setForecastData(result.data.forecast);
          setTotals(result.data.totals || { inflow: 0, outflow: 0, net: 0 });
        } else {
          setForecastData([]);
          setError('No live forecast data available yet.');
        }
      } catch (err) {
        console.error(err);
        if (mounted) setError(err?.message || 'Failed to load forecast');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    if (!authLoading && currentUser) loadForecast();
    return () => { mounted = false; };
  }, [authLoading, currentUser]);

  const columns = [
    { key: 'date', header: 'Date' },
    { key: 'inflow', header: 'Inflow', render: (r) => formatEtb(r.inflow) },
    { key: 'outflow', header: 'Outflow', render: (r) => formatEtb(r.outflow) },
    { key: 'net', header: 'Net', render: (r) => formatEtb(r.net) },
    { key: 'balance', header: 'Balance', render: (r) => formatEtb(r.balance) }
  ];

  return (
    <section>
      <PageHeader title="Cash Flow Forecast" subtitle="30-day cash flow projection (live from the finance ledger)" />
      <BackendStatusBanner error={error} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <PageCard>
          <div className="text-sm text-slate-500 dark:text-slate-400">Projected Inflow (30d)</div>
          <div className="text-xl font-semibold text-emerald-600">{formatEtb(totals.inflow)}</div>
        </PageCard>
        <PageCard>
          <div className="text-sm text-slate-500 dark:text-slate-400">Projected Outflow (30d)</div>
          <div className="text-xl font-semibold text-rose-600">{formatEtb(totals.outflow)}</div>
        </PageCard>
        <PageCard>
          <div className="text-sm text-slate-500 dark:text-slate-400">Net Position (30d)</div>
          <div className={`text-xl font-semibold ${totals.net >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{formatEtb(totals.net)}</div>
        </PageCard>
      </div>
      <PageCard>
        <DataTable columns={columns} rows={forecastData} rowKey="id" loading={loading} />
      </PageCard>
    </section>
  );
}
