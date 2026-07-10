import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';
import PageCard from '../components/PageCard';
import { getApiClient } from '../lib/apiClient';

function formatCurrency(value) {
  return new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency: 'ETB',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatMetric(value) {
  return Number(value || 0).toLocaleString('en-ET');
}

export default function Analytics() {
  const { userProfile } = useAuth();
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);
        const client = getApiClient();
        const response = await client.analytics('engine');
        const payload = response?.data || response;
        setSnapshot(payload);
      } catch (err) {
        setError(err.message || 'Failed to load analytics snapshot');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const summaryCards = useMemo(() => {
    if (!snapshot?.summary) return [];
    return [
      { label: 'Total revenue', value: formatCurrency(snapshot.summary.totalRevenue), hint: 'Sales contribution', tone: 'violet' },
      { label: 'Orders', value: formatMetric(snapshot.summary.totalOrders), hint: 'Open and completed orders', tone: 'blue' },
      { label: 'Pipeline value', value: formatCurrency(snapshot.summary.totalPipelineValue), hint: 'CRM opportunity value', tone: 'emerald' },
      { label: 'Warehouse health', value: snapshot.summary.warehouseHealth ?? '0', hint: 'Ready-to-pick queue', tone: 'amber' },
    ];
  }, [snapshot]);

  const moduleCards = useMemo(() => {
    if (!snapshot?.modules) return [];
    return Object.entries(snapshot.modules).map(([key, module]) => ({
      key,
      name: module.name || key,
      score: module.score || 0,
      trend: module.trend || 0,
      metrics: module.metrics || {},
    }));
  }, [snapshot]);

  return (
    <section className="space-y-6">
      <PageHeader
        title="Operational Analytics"
        subtitle={userProfile?.tenantId ? `Tenant-aware intelligence for ${userProfile.tenantId}` : 'Tenant-aware intelligence for your operating modules'}
      />

      {loading && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <PageCard key={index}>
              <div className="h-20 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
            </PageCard>
          ))}
        </div>
      )}

      {error && (
        <PageCard className="border-amber-300 bg-amber-50/80 dark:border-amber-700 dark:bg-amber-900/20">
          <p className="text-sm text-amber-800 dark:text-amber-300">{error}</p>
        </PageCard>
      )}

      {!loading && !error && snapshot && (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map((card) => (
              <PageCard key={card.label}>
                <div className="text-sm text-slate-500 dark:text-slate-400">{card.label}</div>
                <div className="mt-3 text-2xl font-semibold text-slate-900 dark:text-slate-100">{card.value}</div>
                <div className="mt-2 text-sm text-emerald-600 dark:text-emerald-400">{card.hint}</div>
              </PageCard>
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <PageCard>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Module performance</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Computed from the live tenant analytics engine.</p>
                </div>
              </div>
              <div className="space-y-4">
                {moduleCards.map((module) => (
                  <div key={module.key} className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-800/70">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-slate-100">{module.name}</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">Score {module.score}% · Trend {module.trend > 0 ? `+${module.trend}%` : `${module.trend}%`}</div>
                      </div>
                      <div className="rounded-full bg-violet-100 px-3 py-1 text-sm font-medium text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">{module.score}%</div>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                      <div className="h-full rounded-full bg-violet-500" style={{ width: `${Math.min(100, Math.max(0, module.score))}%` }} />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-sm text-slate-600 dark:text-slate-300">
                      {Object.entries(module.metrics).slice(0, 3).map(([label, value]) => (
                        <span key={label} className="rounded-full border border-slate-200 bg-white px-2.5 py-1 dark:border-slate-700 dark:bg-slate-900">
                          {label}: {typeof value === 'number' ? value.toLocaleString('en-ET') : value}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </PageCard>

            <PageCard>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Operational insights</h2>
              <div className="mt-4 space-y-3">
                {(snapshot.insights || []).map((insight) => (
                  <div key={insight.title} className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">{insight.title}</div>
                    <div className="mt-1">{insight.detail}</div>
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
                <div className="font-semibold">Finance pulse</div>
                <div className="mt-1">Receivables {formatCurrency(snapshot.summary?.totalReceivable || 0)} · Payables {formatCurrency(snapshot.summary?.totalPayable || 0)}</div>
              </div>
            </PageCard>
          </div>
        </>
      )}
    </section>
  );
}
