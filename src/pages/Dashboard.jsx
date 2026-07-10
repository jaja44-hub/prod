import React, { useMemo } from 'react';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';
import PageCard from '../components/PageCard';
import ModuleActivityFeed from '../components/ModuleActivityFeed';
import Skeleton from '../components/Skeleton';
import useAnalyticsSnapshot from '../hooks/useAnalyticsSnapshot';
import { TrendChart, BreakdownList, MetricTile, ProgressRing, currency } from '../components/analytics/AnalyticsCharts';

function formatCurrency(value) {
  return new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB', maximumFractionDigits: 0 }).format(Number(value || 0));
}

export default function Dashboard() {
  const { t } = useLang();
  const { userProfile, loading: authLoading } = useAuth();
  const { snapshot, loading, error } = useAnalyticsSnapshot();

  const summaryCards = useMemo(() => {
    if (!snapshot?.summary) return [];
    return [
      { label: 'Revenue', value: formatCurrency(snapshot.summary.totalRevenue), hint: 'Sales contribution' },
      { label: 'Orders', value: snapshot.summary.totalOrders?.toLocaleString('en-ET') || '0', hint: 'Across active modules' },
      { label: 'Pipeline', value: formatCurrency(snapshot.summary.totalPipelineValue), hint: 'CRM opportunity value' },
      { label: 'Warehouse', value: snapshot.summary.warehouseHealth ?? '0', hint: 'Ready-to-pick queue' },
    ];
  }, [snapshot]);

  const moduleCards = useMemo(() => {
    if (!snapshot?.modules) return [];
    return Object.entries(snapshot.modules).map(([key, module]) => ({ key, name: module.name || key, score: module.score || 0, metrics: module.metrics || {} }));
  }, [snapshot]);

  const financeModule = snapshot?.modules?.finance;
  const warehouseModule = snapshot?.modules?.warehouse;
  const trendData = snapshot?.modules?.sales?.chartData || [];
  const moduleBreakdown = useMemo(() => {
    if (!snapshot?.modules) return [];
    return Object.entries(snapshot.modules).map(([key, module]) => ({
      name: module.name || key,
      value: module.score || 0,
      color: ['#7c3aed', '#0ea5e9', '#f59e0b', '#10b981'][Object.keys(snapshot.modules).indexOf(key) % 4],
      valueLabel: `${module.score || 0}%`,
    }));
  }, [snapshot]);

  if (authLoading || loading) {
    return (
      <div>
        <div className="mb-6 h-8 w-48 erp-skeleton rounded" />
        <Skeleton lines={6} />
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <PageHeader
        title={t('dashboard')}
        subtitle={userProfile?.name ? `${t('dashboardWelcome')}, ${userProfile.name}` : undefined}
      />

      {error && (
        <PageCard className="border-amber-300 bg-amber-50/80 dark:border-amber-700 dark:bg-amber-900/20">
          <p className="text-sm text-amber-800 dark:text-amber-300">{error}</p>
        </PageCard>
      )}

      {!error && snapshot && (
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
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Command center analytics</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">A consolidated view of every module’s operational health.</p>
              </div>
              <div className="space-y-3">
                {moduleCards.map((module) => (
                  <div key={module.key} className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-800/70">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-slate-100">{module.name}</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">Score {module.score}%</div>
                      </div>
                      <div className="rounded-full bg-violet-100 px-3 py-1 text-sm font-medium text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">{module.score}%</div>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                      <div className="h-full rounded-full bg-violet-500" style={{ width: `${Math.min(100, Math.max(0, module.score))}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </PageCard>

            <div className="space-y-4">
              <PageCard>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="inline-flex items-center rounded-full bg-violet-100 px-3 py-1 text-sm font-medium text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">Operational intelligence</div>
                    <h2 className="mt-3 text-lg font-semibold text-slate-900 dark:text-slate-100">CEO control surface</h2>
                  </div>
                  <ProgressRing value={warehouseModule?.score ?? 0} label="Warehouse readiness" sublabel="Live operational health for dispatch and stock movement." />
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <MetricTile label="Finance score" value={`${financeModule?.score ?? 0}%`} detail="finance" tone="emerald" />
                  <MetricTile label="Warehouse score" value={`${warehouseModule?.score ?? 0}%`} detail="warehouse" tone="violet" />
                </div>
                <div className="mt-4 rounded-2xl border border-slate-200 bg-white/70 p-3 dark:border-slate-700 dark:bg-slate-800/70">
                  <div className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-100">Performance trend</div>
                  <TrendChart data={trendData} dataKeys={['value']} />
                </div>
              </PageCard>

              <PageCard>
                <div className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">Module health breakdown</div>
                <BreakdownList data={moduleBreakdown} />
              </PageCard>
            </div>
          </div>
        </>
      )}

      <PageCard padding="sm">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-base mb-4">Module Activity</h3>
        <ModuleActivityFeed />
      </PageCard>
    </section>
  );
}
