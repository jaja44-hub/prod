/**
 * src/pages/AnalyticsDashboard.jsx
 * Analytics dashboard component integrating KPI metrics and budget decisions APIs.
 */

import { useEffect, useState } from 'react';
import { getApiClient } from '../../api/client.js';

export function AnalyticsDashboard() {
  const [metricsData, setMetricsData] = useState(null);
  const [decisionsData, setDecisionsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const client = getApiClient();

        // Fetch KPI metrics dashboard
        const metrics = await client.analytics('metrics');
        setMetricsData(metrics);

        // Fetch decision support (reorder suggestions + budget analysis)
        const decisions = await client.analytics('decisions');
        setDecisionsData(decisions);
      } catch (err) {
        setError(err.message || 'Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="analytics-dashboard loading">Loading analytics data...</div>;
  if (error) return <div className="analytics-dashboard error">Error: {error}</div>;

  return (
    <div className="analytics-dashboard">
      <h1>Analytics & Insights</h1>

      {metricsData && (
        <div className="metrics-section">
          <h2>Financial KPI Dashboard</h2>
          <div className="kpi-cards">
            <div className="kpi-card revenue">
              <h3>Revenue</h3>
              <div className="metric-display">
                <span className="value">${metricsData.report?.kpis?.totalRevenue || 0}</span>
                <span className="currency">USD</span>
              </div>
              <span className="status">{metricsData.report?.health?.revenueStatus || 'healthy'}</span>
            </div>

            <div className="kpi-card cost">
              <h3>Total Cost</h3>
              <div className="metric-display">
                <span className="value">${metricsData.report?.kpis?.totalCost || 0}</span>
                <span className="currency">USD</span>
              </div>
              <span className="status">{metricsData.report?.health?.costStatus || 'healthy'}</span>
            </div>

            <div className="kpi-card margin">
              <h3>Gross Margin</h3>
              <div className="metric-display">
                <span className="value">{metricsData.report?.kpis?.marginPercentage || 0}%</span>
              </div>
              <span className="status">{metricsData.report?.health?.marginStatus || 'healthy'}</span>
            </div>

            <div className="kpi-card health">
              <h3>Overall Health</h3>
              <div className="metric-display">
                <span className="status-badge">{metricsData.report?.health?.overallStatus || 'unknown'}</span>
              </div>
            </div>
          </div>

          <div className="currency-breakdown">
            <h3>Revenue by Currency</h3>
            <table>
              <thead>
                <tr>
                  <th>Currency</th>
                  <th>Amount</th>
                  <th>Percentage</th>
                </tr>
              </thead>
              <tbody>
                {metricsData.report?.currencyBreakdown &&
                  Object.entries(metricsData.report.currencyBreakdown).map(([currency, amount]) => (
                    <tr key={currency}>
                      <td>{currency}</td>
                      <td>{amount}</td>
                      <td>
                        {metricsData.report?.kpis?.totalRevenue > 0
                          ? ((amount / metricsData.report.kpis.totalRevenue) * 100).toFixed(2)
                          : 0}
                        %
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {decisionsData && (
        <div className="decisions-section">
          <h2>Business Insights</h2>

          <div className="reorder-section">
            <h3>Reorder Recommendations</h3>
            <table>
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Current Stock</th>
                  <th>Reorder Point</th>
                  <th>Suggested Qty</th>
                  <th>Urgency</th>
                </tr>
              </thead>
              <tbody>
                {decisionsData.report?.reorderSuggestions &&
                  decisionsData.report.reorderSuggestions.slice(0, 15).map((suggestion) => (
                    <tr key={suggestion.sku} className={`urgency-${suggestion.urgency}`}>
                      <td>{suggestion.sku}</td>
                      <td>{suggestion.currentStock}</td>
                      <td>{suggestion.reorderPoint}</td>
                      <td>{suggestion.suggestedQuantity}</td>
                      <td className="urgency-badge">{suggestion.urgency}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          <div className="budget-variance-section">
            <h3>Budget Variance Analysis</h3>
            <div className="variance-summary">
              <p>Budget Status: {decisionsData.report?.budgetAnalysis?.status || 'unknown'}</p>
              <p>Total Variance: {decisionsData.report?.budgetAnalysis?.totalVariance || 0}%</p>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Budget</th>
                  <th>Actual</th>
                  <th>Variance</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {decisionsData.report?.budgetAnalysis?.lineItems &&
                  decisionsData.report.budgetAnalysis.lineItems.slice(0, 10).map((item) => (
                    <tr key={item.category} className={`variance-${item.status}`}>
                      <td>{item.category}</td>
                      <td>${item.budgeted}</td>
                      <td>${item.actual}</td>
                      <td>{item.variancePercent}%</td>
                      <td>{item.status}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default AnalyticsDashboard;
