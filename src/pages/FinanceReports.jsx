/**
 * src/pages/FinanceReports.jsx
 * Finance reports page - unique view for financial reports and analytics
 */

import React, { useEffect, useState } from 'react';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';
import PageCard from '../components/PageCard';
import useAnalyticsSnapshot from '../hooks/useAnalyticsSnapshot';
import { MetricTile, ProgressRing, TrendChart, BreakdownList, InsightPills, currency } from '../components/analytics/AnalyticsCharts';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

export default function FinanceReports() {
  const { t } = useLang();
  const { currentUser, loading: authLoading } = useAuth();
  const { snapshot } = useAnalyticsSnapshot();
  const financeAnalytics = snapshot?.modules?.finance;
  const financeMetrics = financeAnalytics?.metrics || {};

  const COLORS = ['#8b5cf6', '#6366f1', '#ec4899', '#10b981', '#f59e0b', '#3b82f6'];

  // Prepare revenue by month chart data
  const revenueByMonth = financeAnalytics?.chartData || [];
  
  // Prepare expense breakdown data
  const expenseBreakdown = (financeAnalytics?.breakdown || []).map((item, index) => ({
    name: item.name,
    value: item.value,
    color: COLORS[index % COLORS.length]
  }));

  return (
    <section>
      <PageHeader
        title={t('reports') || 'Financial Reports'}
        subtitle={t('reportsDescription') || 'Comprehensive financial analytics and reporting'}
      />

      {/* Executive Summary */}
      <PageCard className="mb-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="inline-flex items-center rounded-full bg-violet-100 px-3 py-1 text-sm font-medium text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">Executive Summary</div>
            <h2 className="mt-3 text-xl font-semibold text-slate-900 dark:text-slate-100">Financial Health Overview</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Key performance indicators and financial position analysis.</p>
          </div>
          <ProgressRing value={financeAnalytics?.score || 0} label="Finance Score" sublabel="Overall financial health indicator" />
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <MetricTile label="Total Revenue" value={currency(financeMetrics.totalRevenue ?? 0)} detail="Period" tone="emerald" />
              <MetricTile label="Total Expenses" value={currency(financeMetrics.totalExpense ?? 0)} detail="Period" tone="amber" />
              <MetricTile label="Net Profit" value={currency(financeMetrics.netProfit ?? 0)} detail="Period" tone="violet" />
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800/80">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Revenue Trend</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Monthly revenue performance</p>
                </div>
              </div>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueByMonth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <RechartsTooltip 
                      cursor={{fill: 'rgba(139, 92, 246, 0.05)'}}
                      contentStyle={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.95)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      formatter={(value) => currency(value)}
                    />
                    <Bar dataKey="receivable" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Revenue" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800/80">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Expense Breakdown</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Distribution by category</p>
              <div className="mt-4 h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {expenseBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value) => currency(value)} />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-violet-600 to-fuchsia-600 p-4 text-white shadow-sm">
              <div className="text-sm font-medium text-violet-100">Key Insights</div>
              <div className="mt-2 text-lg font-semibold">
                {financeMetrics.profitMargin ? `Profit Margin: ${financeMetrics.profitMargin.toFixed(1)}%` : 'Data loading...'}
              </div>
              <div className="mt-4">
                <InsightPills items={[
                  { title: 'Revenue Growth', direction: financeMetrics.revenueGrowth > 0 ? 'up' : 'down' },
                  { title: 'Cost Control', direction: 'up' }
                ]} />
              </div>
            </div>
          </div>
        </div>
      </PageCard>

      {/* Detailed Metrics */}
      <PageCard>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Detailed Financial Metrics</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricTile label="Gross Margin" value={`${financeMetrics.grossMargin ?? 0}%`} detail="Revenue" tone="emerald" />
          <MetricTile label="Operating Margin" value={`${financeMetrics.operatingMargin ?? 0}%`} detail="EBITDA" tone="blue" />
          <MetricTile label="Current Ratio" value={financeMetrics.currentRatio?.toFixed(2) || '0.00'} detail="Liquidity" tone="violet" />
          <MetricTile label="Debt Ratio" value={`${financeMetrics.debtRatio ?? 0}%`} detail="Leverage" tone="amber" />
        </div>
      </PageCard>
    </section>
  );
}
