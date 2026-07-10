import React from 'react';
import PageHeader from '../components/PageHeader';
import PageCard from '../components/PageCard';

const insightCards = [
  { label: 'OEE', value: '84.5%', delta: '+2.1% vs last month', tone: 'violet' },
  { label: 'Inventory Turnover', value: '4.2x', delta: '+0.3x vs last month', tone: 'blue' },
  { label: 'Fulfillment Rate', value: '98.1%', delta: 'Stable across the week', tone: 'emerald' },
  { label: 'Supply Risk', value: 'Low', delta: 'No major disruptions forecast', tone: 'slate' },
];

const weeklyOutput = [45, 52, 38, 65, 59, 80, 71];
const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function Analytics() {
  return (
    <section className="space-y-6">
      <PageHeader
        title="Operational Analytics"
        subtitle="Executive-grade performance signals for warehouse, procurement, and fulfillment teams."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {insightCards.map((card) => (
          <PageCard key={card.label}>
            <div className="text-sm text-slate-500 dark:text-slate-400">{card.label}</div>
            <div className="mt-3 text-3xl font-semibold text-slate-900 dark:text-slate-100">{card.value}</div>
            <div className="mt-2 text-sm text-emerald-600 dark:text-emerald-400">{card.delta}</div>
          </PageCard>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <PageCard>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Production output</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">A weekly pulse of throughput and demand pressure.</p>
            </div>
            <div className="rounded-full bg-violet-100 px-3 py-1 text-xs font-medium text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">Last 7 days</div>
          </div>
          <div className="flex h-56 items-end gap-2">
            {weeklyOutput.map((value, idx) => (
              <div key={weekDays[idx]} className="flex h-full w-full flex-col justify-end">
                <div className="rounded-t-xl bg-violet-500/85" style={{ height: `${(value / 80) * 100}%` }} />
                <div className="mt-2 text-center text-xs text-slate-500 dark:text-slate-400">{weekDays[idx]}</div>
              </div>
            ))}
          </div>
        </PageCard>

        <PageCard>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Predictive guidance</h2>
          <div className="mt-4 space-y-3">
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
              <div className="font-semibold">Demand spike watch</div>
              <div className="mt-1">Forecasting shows a short-term uplift in fast-moving SKU demand next week.</div>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
              <div className="font-semibold">Maintenance signal</div>
              <div className="mt-1">Preventive planning is aligned with the next two scheduled maintenance windows.</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300">
              <div className="font-semibold">Procurement recommendation</div>
              <div className="mt-1">Replenishment should remain conservative until the warehouse backlog is cleared.</div>
            </div>
          </div>
        </PageCard>
      </div>
    </section>
  );
}
