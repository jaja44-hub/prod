import { computeRevenueMetrics, computeCostMetrics, computeMarginMetrics, buildKpiDashboard } from '../api/analytics/metrics.js';
import { suggestReorderQuantity, analyzeVariance, buildBudgetAnalysis } from '../api/analytics/decisions.js';

(async () => {
  try {
    const revenue = computeRevenueMetrics([
      { amount: 12000, currency: 'ETB' },
      { amount: 8500, currency: 'ETB' },
    ]);
    if (revenue.totalRevenue !== 20500) throw new Error('Revenue calculation mismatch');

    const costs = computeCostMetrics([
      { amount: 5500, category: 'cogs' },
      { amount: 2000, category: 'overhead' },
    ]);
    if (costs.totalCost !== 7500) throw new Error('Cost calculation mismatch');

    const margins = computeMarginMetrics(20500, 7500);
    if (margins.grossProfit !== 13000 || margins.marginPercent < 63 || margins.marginPercent > 64) {
      throw new Error('Margin calculation mismatch');
    }

    const dashboard = buildKpiDashboard({
      transactions: [
        { amount: 12000, currency: 'ETB' },
        { amount: 8500, currency: 'ETB' },
      ],
      costItems: [
        { amount: 5500, category: 'cogs' },
        { amount: 2000, category: 'overhead' },
      ],
      tenantId: 'test-tenant',
    });
    if (dashboard.summary.kpiStatus !== 'healthy') throw new Error('Dashboard KPI status mismatch');

    const budgetAnalysis = buildBudgetAnalysis([
      { name: 'Materials', budgeted: 50000, actual: 48500 },
      { name: 'Labor', budgeted: 30000, actual: 31200 },
      { name: 'Overhead', budgeted: 15000, actual: 14800 },
    ]);
    if (budgetAnalysis.totalBudget !== 95000 || budgetAnalysis.totalActual !== 94500) {
      throw new Error('Budget analysis totals mismatch');
    }

    const reorderSuggestion = suggestReorderQuantity(200, 7, 3);
    if (reorderSuggestion.reorderPoint !== 2000) throw new Error('Reorder point mismatch');

    const variance = analyzeVariance(100000, 98500);
    if (variance.status !== 'on_track') throw new Error('Variance status mismatch');

    console.log('TICKET-051c/d Analytics & Decision-support integration tests passed');
    process.exit(0);
  } catch (err) {
    console.error('TICKET-051c/d tests failed', err);
    process.exit(2);
  }
})();
