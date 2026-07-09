/**
 * src/pages/FinanceDashboard.jsx
 * Finance dashboard component integrating AP/AR aging and reconciliation APIs.
 */

import { useEffect, useState } from 'react';
import { getApiClient } from '../../api/client.js';

export function FinanceDashboard() {
  const [agingData, setAgingData] = useState(null);
  const [reconciliationData, setReconciliationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
    <div className="finance-dashboard">
      <h1>Finance Dashboard</h1>

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
    </div>
  );
}

export default FinanceDashboard;
