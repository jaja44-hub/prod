import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';
import PageCard from '../components/PageCard';
import DataTable from '../components/DataTable';
import { formatEtb } from '../lib/formatEtb';

export default function CashFlowForecast() {
  const { currentUser, loading: authLoading } = useAuth();
  const [forecastData, setForecastData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadForecast() {
      setLoading(true);
      try {
        const mock = [
          { id: 1, date: '2026-07-19', inflow: 150000, outflow: 85000, net: 65000, balance: 65000 },
          { id: 2, date: '2026-07-20', inflow: 75000, outflow: 120000, net: -45000, balance: 20000 },
          { id: 3, date: '2026-07-21', inflow: 200000, outflow: 95000, net: 105000, balance: 125000 }
        ];
        setForecastData(mock);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    if (!authLoading && currentUser) loadForecast();
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
      <PageHeader title="Cash Flow Forecast" subtitle="30-day cash flow projection" />
      <PageCard><DataTable columns={columns} rows={forecastData} rowKey="id" loading={loading} /></PageCard>
    </section>
  );
}
