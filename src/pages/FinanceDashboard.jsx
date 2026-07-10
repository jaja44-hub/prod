/**
 * src/pages/FinanceDashboard.jsx
 * Finance dashboard component integrating AP/AR aging and reconciliation APIs.
 */

import { useEffect, useState } from 'react';
import { getApiClient } from '../lib/apiClient.js';
import PageHeader from '../components/PageHeader';
import PageCard from '../components/PageCard';
import useAnalyticsSnapshot from '../hooks/useAnalyticsSnapshot';

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
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Finance analytics</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Receivables, payables, and margin health for the active tenant.</p>
            </div>
            <div className="rounded-full bg-violet-100 px-3 py-1 text-sm font-medium text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">{snapshot.modules.finance.score}%</div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/70">
              <div className="text-sm text-slate-500 dark:text-slate-400">Receivables</div>
              <div className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-100">{snapshot.modules.finance.metrics?.totalReceivable ?? 0}</div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/70">
              <div className="text-sm text-slate-500 dark:text-slate-400">Payables</div>
              <div className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-100">{snapshot.modules.finance.metrics?.totalPayable ?? 0}</div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/70">
              <div className="text-sm text-slate-500 dark:text-slate-400">Margin</div>
              <div className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-100">{snapshot.modules.finance.metrics?.margin ?? 0}%</div>
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
