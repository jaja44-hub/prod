import { promises as fs } from 'fs';
import { computeRevenueMetrics, computeCostMetrics, computeMarginMetrics, buildKpiDashboard } from '../server/api/analytics/metrics.js';
import { suggestReorderQuantity, analyzeVariance, buildBudgetAnalysis } from '../server/api/analytics/decisions.js';

const API_INDEX_PATH = new URL('../api/index.js', import.meta.url).pathname;

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

async function validateRouter() {
  const contents = await fs.readFile(API_INDEX_PATH, 'utf8');
  assert(contents.includes("analyticsMetricsHandler"), 'Missing analyticsMetricsHandler import');
  assert(contents.includes("analyticsDecisionsHandler"), 'Missing analyticsDecisionsHandler import');
  assert(contents.includes("/api/analytics/metrics"), 'Missing analytics metrics route');
  assert(contents.includes("/api/analytics/decisions"), 'Missing analytics decisions route');
}

function validateMetricsShape() {
  const dashboard = buildKpiDashboard({
    transactions: [{ amount: 10000, currency: 'ETB' }, { amount: 2500, currency: 'USD' }],
    costItems: [{ amount: 5200, category: 'cogs' }, { amount: 1800, category: 'overhead' }],
    tenantId: 'test-tenant',
  });

  assert(dashboard.success === true, 'Dashboard response missing success flag');
  assert(dashboard.report?.kpis?.totalRevenue === 12500, 'Revenue total mismatch');
  assert(typeof dashboard.report.health.overallStatus === 'string', 'Missing overallStatus');
  assert(Object.keys(dashboard.report.currencyBreakdown).length >= 2, 'Currency breakdown missing entries');
}

function validateDecisionsShape() {
  const reorder = suggestReorderQuantity(18, 40, 5);
  assert(reorder.shouldReorder === true, 'Reorder suggestion should be true for low stock');
  assert(['low', 'medium', 'high', 'critical'].includes(reorder.urgency), 'Invalid urgency label');

  const variance = analyzeVariance(120000, 116000);
  assert(variance.status === 'on_track' || variance.status === 'under', 'Unexpected variance status');

  const budget = buildBudgetAnalysis([
    { name: 'Materials', budgeted: 50000, actual: 48000 },
    { name: 'Labor', budgeted: 25000, actual: 26500 },
  ]);
  assert(budget.items.length === 2, 'Budget analysis line item count mismatch');
  assert(typeof budget.totalVariance === 'number', 'Budget totalVariance should be numeric');
}

(async () => {
  try {
    await validateRouter();
    validateMetricsShape();
    validateDecisionsShape();
    console.log('TICKET-051e analytics regression test passed');
    process.exit(0);
  } catch (err) {
    console.error('TICKET-051e analytics regression test failed:', err.message);
    process.exit(1);
  }
})();
