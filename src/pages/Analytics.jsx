import React, { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';
import PageCard from '../components/PageCard';
import useAnalyticsSnapshot from '../hooks/useAnalyticsSnapshot';
import { TrendChart, BreakdownList, MetricTile, ProgressRing, currency } from '../components/analytics/AnalyticsCharts';

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
  const { snapshot, loading, error } = useAnalyticsSnapshot();

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

  const financeModule = snapshot?.modules?.finance;
  const warehouseModule = snapshot?.modules?.warehouse;
  const salesChartData = snapshot?.modules?.sales?.chartData || [];
  const insightItems = (snapshot?.insights || []).map((insight) => ({ title: insight.title, direction: insight.severity === 'positive' ? 'up' : 'down' }));

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

            <div className="space-y-4">
              <PageCard>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="inline-flex items-center rounded-full bg-violet-100 px-3 py-1 text-sm font-medium text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">Executive view</div>
                    <h2 className="mt-3 text-lg font-semibold text-slate-900 dark:text-slate-100">Operational insights</h2>
                  </div>
                  <ProgressRing value={warehouseModule?.score ?? 0} label="Warehouse health" sublabel="Rounded view of stock movement and dispatch readiness." />
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <MetricTile label="Receivables" value={currency(financeModule?.metrics?.totalReceivable ?? 0)} detail="AR" tone="violet" />
                  <MetricTile label="Payables" value={currency(financeModule?.metrics?.totalPayable ?? 0)} detail="AP" tone="blue" />
                </div>
                <div className="mt-4 rounded-2xl border border-slate-200 bg-white/70 p-3 dark:border-slate-700 dark:bg-slate-800/70">
                  <div className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-100">Sales momentum</div>
                  <TrendChart data={salesChartData} dataKeys={['value']} />
                </div>
              </PageCard>

              <PageCard>
                <div className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">Snapshot highlights</div>
                <BreakdownList data={(snapshot?.modules?.warehouse?.breakdown || []).map((item) => ({ ...item, valueLabel: `${item.value}` }))} />
                <div className="mt-4">
                  <InsightPills items={insightItems} />
                </div>
              </PageCard>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
