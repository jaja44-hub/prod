import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

function currency(value) {
  return new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency: 'ETB',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function compact(value) {
  return new Intl.NumberFormat('en-ET', { notation: 'compact', maximumFractionDigits: 1 }).format(Number(value || 0));
}

export function MetricTile({ label, value, detail, tone = 'violet' }) {
  const toneStyles = {
    violet: 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300',
    blue: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300',
    emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800/80">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm text-slate-500 dark:text-slate-400">{label}</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">{value}</div>
        </div>
        <div className={`rounded-full px-2.5 py-1 text-xs font-semibold ${toneStyles[tone] || toneStyles.violet}`}>
          {detail}
        </div>
      </div>
    </div>
  );
}

export function ProgressRing({ value = 0, label, sublabel }) {
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - Math.min(100, Math.max(0, value)) / 100);

  return (
    <div className="flex items-center gap-5 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-800/70">
      <div className="relative flex h-28 w-28 items-center justify-center">
        <svg viewBox="0 0 120 120" className="h-28 w-28 -rotate-90">
          <circle cx="60" cy="60" r={radius} stroke="#e2e8f0" strokeWidth="12" fill="none" />
          <circle
            cx="60"
            cy="60"
            r={radius}
            stroke="#7c3aed"
            strokeWidth="12"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
          />
        </svg>
        <div className="absolute text-center">
          <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{Math.round(value)}%</div>
          <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Health</div>
        </div>
      </div>
      <div>
        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{label}</div>
        <div className="mt-2 max-w-xs text-sm text-slate-500 dark:text-slate-400">{sublabel}</div>
      </div>
    </div>
  );
}

export function TrendChart({ data = [], dataKeys = [], height = 220 }) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
          <YAxis tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
          <Tooltip />
          {dataKeys.map((key, index) => (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              stroke={['#7c3aed', '#0ea5e9', '#f59e0b'][index % 3]}
              fill="url(#trendFill)"
              strokeWidth={2.4}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DistributionChart({ data = [], height = 220 }) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={58} outerRadius={84} paddingAngle={2}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color || '#7c3aed'} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => compact(value)} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BarTrendChart({ data = [], dataKeys = [], height = 220 }) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
          <YAxis tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
          <Tooltip />
          {dataKeys.map((key, index) => (
            <Bar key={key} dataKey={key} fill={['#7c3aed', '#0ea5e9', '#f59e0b'][index % 3]} radius={[6, 6, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BreakdownList({ data = [] }) {
  return (
    <div className="space-y-3">
      {data.map((item) => (
        <div key={item.name} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-3 dark:border-slate-700 dark:bg-slate-800/70">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color || '#7c3aed' }} />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{item.name}</span>
          </div>
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.valueLabel || compact(item.value)}</div>
        </div>
      ))}
    </div>
  );
}

export function InsightPills({ items = [] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <div key={item.title} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
          {item.direction === 'up' ? <ArrowUpRight className="h-4 w-4 text-emerald-500" /> : <ArrowDownRight className="h-4 w-4 text-amber-500" />}
          <span>{item.title}</span>
        </div>
      ))}
    </div>
  );
}

export { currency, compact };
