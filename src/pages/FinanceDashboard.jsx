/**
 * src/pages/FinanceDashboard.jsx
 * Finance dashboard component integrating AP/AR aging and reconciliation APIs.
 */

import { useEffect, useState } from 'react';
import { getApiClient } from '../lib/apiClient.js';
import PageHeader from '../components/PageHeader';
import PageCard from '../components/PageCard';
import useAnalyticsSnapshot from '../hooks/useAnalyticsSnapshot';
import { MetricTile, ProgressRing, TrendChart, BreakdownList, InsightPills, currency } from '../components/analytics/AnalyticsCharts';

export function FinanceDashboard() {
  const [agingData, setAgingData] = useState(null);
  const [reconciliationData, setReconciliationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { snapshot } = useAnalyticsSnapshot();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const client = getApiClient();

        // Fetch aging report
        const aging = await client.finance('aging');
        setAgingData(aging);

        // Fetch reconciliation data (mock)
        const reconciliation = {
          success: true,
          report: {
            results: [],
            unmatchedPayments: [],
          },
        };
        setReconciliationData(reconciliation);
      } catch (err) {
        setError(err.message || 'Failed to load finance data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="finance-dashboard loading">Loading finance data...</div>;
  if (error) return <div className="finance-dashboard error">Error: {error}</div>;

  return (
    <section className="space-y-6">
      <PageHeader title="Finance Dashboard" subtitle="Working capital, payables, and receivables measured through the shared analytics engine." />

      {snapshot?.modules?.finance && (
        <PageCard>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="inline-flex items-center rounded-full bg-violet-100 px-3 py-1 text-sm font-medium text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">Finance analytics</div>
              <h2 className="mt-3 text-xl font-semibold text-slate-900 dark:text-slate-100">Working capital health and liquidity outlook</h2>
              <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">Modern cash-flow intelligence for receivables, payables, and margin visibility using the shared analytics engine.</p>
            </div>
            <ProgressRing value={snapshot.modules.finance.score} label="Finance health" sublabel="Balances liquidity pressure with operating margin strength." />
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <MetricTile label="Receivables" value={currency(snapshot.modules.finance.metrics?.totalReceivable ?? 0)} detail="AR" tone="violet" />
                <MetricTile label="Payables" value={currency(snapshot.modules.finance.metrics?.totalPayable ?? 0)} detail="AP" tone="blue" />
                <MetricTile label="Margin" value={`${snapshot.modules.finance.metrics?.margin ?? 0}%`} detail="profit" tone="emerald" />
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800/80">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Cash-flow trend</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">A simplified month-by-month view of receivables vs payables.</p>
                  </div>
                </div>
                <TrendChart data={snapshot.modules.finance.chartData} dataKeys={['receivable', 'payable']} />
              </div>
            </div>
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800/80">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Account structure</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Current balance composition across core finance buckets.</p>
                <div className="mt-4">
                  <BreakdownList data={snapshot.modules.finance.breakdown?.map((item) => ({ ...item, valueLabel: item.name === 'Margin' ? `${item.value}%` : currency(item.value) })) || []} />
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-emerald-600 to-cyan-600 p-4 text-white shadow-sm">
                <div className="text-sm font-medium text-emerald-100">Leadership note</div>
                <div className="mt-2 text-lg font-semibold">{snapshot.insights?.find((item) => item.title === 'Revenue pulse')?.detail}</div>
                <div className="mt-4"><InsightPills items={[{ title: 'Collections steady', direction: 'up' }, { title: 'Risk contained', direction: 'up' }]} /></div>
              </div>
            </div>
          </div>
        </PageCard>
      )}

      {agingData && (
        <div className="aging-section">
          <h2>Accounts Payable & Receivable Aging</h2>
          <div className="aging-metrics">
            <div className="metric">
              <label>Total Payable:</label>
              <span>{agingData.report?.summary?.totalPayable || 0}</span>
            </div>
            <div className="metric">
              <label>Total Receivable:</label>
              <span>{agingData.report?.summary?.totalReceivable || 0}</span>
            </div>
            <div className="metric">
              <label>Vendor Count:</label>
              <span>{agingData.report?.summary?.vendorCount || 0}</span>
            </div>
          </div>

          <div className="aging-tables">
            <div className="table">
              <h3>Accounts Payable Aging</h3>
              <table>
                <thead>
                  <tr>
                    <th>Bucket</th>
                    <th>Count</th>
                  </tr>
                </thead>
                <tbody>
                  {agingData.report?.accountsPayable &&
                    Object.entries(agingData.report.accountsPayable).map(([bucket, items]) => (
                      <tr key={bucket}>
                        <td>{bucket}</td>
                        <td>{Array.isArray(items) ? items.length : 0}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <div className="table">
              <h3>Accounts Receivable Aging</h3>
              <table>
                <thead>
                  <tr>
                    <th>Bucket</th>
                    <th>Count</th>
                  </tr>
                </thead>
                <tbody>
                  {agingData.report?.accountsReceivable &&
                    Object.entries(agingData.report.accountsReceivable).map(([bucket, items]) => (
                      <tr key={bucket}>
                        <td>{bucket}</td>
                        <td>{Array.isArray(items) ? items.length : 0}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {reconciliationData && (
        <div className="reconciliation-section">
          <h2>Invoice & Payment Reconciliation</h2>
          <div className="reconciliation-summary">
            <p>Matched invoices: {reconciliationData.report?.results?.length || 0}</p>
            <p>Unmatched payments: {reconciliationData.report?.unmatchedPayments?.length || 0}</p>
          </div>
        </div>
      )}
    </section>
  );
}

export default FinanceDashboard;
