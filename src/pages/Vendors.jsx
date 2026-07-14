/**
 * src/pages/Vendors.jsx
 * Vendors page - unique view for supplier/vendor management
 */

import React, { useEffect, useState } from 'react';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import {
  getOdooVendors,
  BACKEND_WAKEUP_MESSAGE
} from '../services/ServiceGateway';
import ListFilterBar from '../components/ListFilterBar';
import PageHeader from '../components/PageHeader';
import PageCard from '../components/PageCard';
import DataTable from '../components/DataTable';
import StateBadge from '../components/StateBadge';
import BackendStatusBanner from '../components/BackendStatusBanner';
import useAnalyticsSnapshot from '../hooks/useAnalyticsSnapshot';
import { MetricTile, currency } from '../components/analytics/AnalyticsCharts';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';

export default function Vendors() {
  const { t } = useLang();
  const { currentUser, loading: authLoading } = useAuth();
  const { snapshot } = useAnalyticsSnapshot();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ search: '' });

  const normalizeErrorMessage = (err) => {
    const raw = err?.response?.data?.error || err?.message || t('error');
    return raw === BACKEND_WAKEUP_MESSAGE ? t('backendWakingUp') : raw;
  };

  useEffect(() => {
    let mounted = true;
    async function loadVendors() {
      setLoading(true);
      setError('');
      try {
        const result = await getOdooVendors(100, {
          search: filters.search || undefined,
        });
        if (mounted) setVendors(Array.isArray(result) ? result : []);
      } catch (err) {
        if (mounted) setError(normalizeErrorMessage(err));
      } finally {
        if (mounted) setLoading(false);
      }
    }
    if (authLoading || !currentUser) return;
    loadVendors();
    return () => { mounted = false; };
  }, [currentUser, authLoading, filters]);

  const columns = [
    { key: 'name', header: t('name') || 'Name', className: 'font-semibold text-gray-900 dark:text-gray-100' },
    { key: 'email', header: t('email') || 'Email', className: 'text-gray-600 dark:text-gray-400' },
    { key: 'phone', header: t('phone') || 'Phone', className: 'text-gray-600 dark:text-gray-400' },
    { key: 'city', header: t('city') || 'City', className: 'text-gray-600 dark:text-gray-400' },
    { key: 'supplier_rank', header: 'Rank', className: 'text-center', render: (r) => r.supplier_rank || '—' },
  ];

  // Vendor status distribution for pie chart
  const activeVendors = vendors.filter(v => v.active).length;
  const inactiveVendors = vendors.filter(v => !v.active).length;
  
  const vendorStatusData = [
    { name: 'Active', value: activeVendors, color: '#10b981' },
    { name: 'Inactive', value: inactiveVendors, color: '#f59e0b' }
  ].filter(d => d.value > 0);

  return (
    <section>
      <PageHeader
        title={t('vendors') || 'Vendors'}
        subtitle={t('vendorsDescription') || 'Manage supplier relationships and vendor performance'}
      />

      <PageCard className="mb-6">
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <MetricTile label="Total Vendors" value={vendors.length} detail="All" tone="violet" />
          </div>
          <div className="lg:col-span-2 rounded-xl border border-white/20 bg-white/60 p-6 backdrop-blur-xl shadow-lg dark:border-slate-700/50 dark:bg-slate-800/60">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">Vendor Status Distribution</h3>
            <div className="h-[150px]">
              {vendorStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={vendorStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={60}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {vendorStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-500 italic">
                  No vendor data available
                </div>
              )}
            </div>
          </div>
        </div>
      </PageCard>

      <PageCard>
        <ListFilterBar
          model="res.partner"
          value={filters}
          onChange={setFilters}
          onApply={() => setFilters((current) => ({ ...current }))}
          onClear={() => setFilters({ search: '' })}
          fields={['search']}
          loading={loading}
        />

        {error && (
          <div className="my-4">
            <BackendStatusBanner message={error} onRetry={() => setFilters((current) => ({ ...current }))} />
          </div>
        )}

        <DataTable
          columns={columns}
          rows={vendors}
          rowKey="id"
          loading={loading}
          emptyTitle="No vendors found"
          emptyIcon="🏭"
        />

        {!loading && !error && vendors.length > 0 && (
          <div className="mt-4 flex justify-between items-center text-xs text-gray-400">
            <span>Loaded {vendors.length} vendors</span>
            <span>End of results</span>
          </div>
        )}
      </PageCard>
    </section>
  );
}
