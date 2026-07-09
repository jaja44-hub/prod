import { computeRevenueMetrics, computeCostMetrics, computeMarginMetrics, buildKpiDashboard } from '../api/analytics/metrics.js';

(async () => {
  try {
    const revenue = computeRevenueMetrics([
      { amount: 5000, currency: 'ETB' },
      { amount: 3200, currency: 'ETB' },
    ]);
    if (revenue.totalRevenue !== 8200 || revenue.transactionCount !== 2) {
      throw new Error('Revenue metrics calculation failed');
    }

    const costs = computeCostMetrics([
      { amount: 2100, category: 'cogs' },
      { amount: 800, category: 'overhead' },
    ]);
    if (costs.totalCost !== 2900 || costs.itemCount !== 2) {
      throw new Error('Cost metrics calculation failed');
    }

    const margins = computeMarginMetrics(8200, 2900);
    if (margins.grossProfit !== 5300 || margins.marginPercent < 64 || margins.marginPercent > 65) {
      throw new Error('Margin metrics calculation failed');
    }

    const dashboard = buildKpiDashboard({
      transactions: [
        { amount: 10000, currency: 'ETB' },
        { amount: 6500, currency: 'ETB' },
      ],
      costItems: [
        { amount: 4200, category: 'cogs' },
        { amount: 1500, category: 'overhead' },
      ],
      tenantId: 'test-tenant',
    });

    if (!dashboard || dashboard.tenantId !== 'test-tenant' || dashboard.revenue.totalRevenue !== 16500) {
      throw new Error('KPI dashboard generation failed');
    }
    if (dashboard.summary.kpiStatus !== 'healthy') {
      throw new Error('KPI status calculation incorrect');
    }

    console.log('TICKET-051a Analytics metrics tests passed');
    process.exit(0);
  } catch (err) {
    console.error('TICKET-051a tests failed', err);
    process.exit(2);
  }
})();
