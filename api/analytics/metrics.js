import { verifyBearerToken } from '../../server/api/lib/firebaseAdmin.js';
import { enforceModuleAccess } from '../../server/api/lib/policyOrchestrator.js';

/**
 * Aggregates financial metrics from transactional data.
 * Supports revenue, cost, margin, and trend calculations.
 */
export function computeRevenueMetrics(transactions = []) {
  if (transactions.length === 0) {
    return { totalRevenue: 0, averageOrderValue: 0, transactionCount: 0, currencyBreakdown: {} };
  }

  const currencyBreakdown = {};
  let totalRevenue = 0;

  for (const txn of transactions) {
    const amount = Number(txn.amount || 0);
    const currency = txn.currency || 'ETB';
    totalRevenue += amount;
    currencyBreakdown[currency] = (currencyBreakdown[currency] || 0) + amount;
  }

  return {
    totalRevenue,
    averageOrderValue: totalRevenue / transactions.length,
    transactionCount: transactions.length,
    currencyBreakdown,
  };
}

export function computeCostMetrics(costItems = []) {
  if (costItems.length === 0) {
    return { totalCost: 0, averageCostPerItem: 0, itemCount: 0, categoryBreakdown: {} };
  }

  const categoryBreakdown = {};
  let totalCost = 0;

  for (const item of costItems) {
    const amount = Number(item.amount || 0);
    const category = item.category || 'uncategorized';
    totalCost += amount;
    categoryBreakdown[category] = (categoryBreakdown[category] || 0) + amount;
  }

  return {
    totalCost,
    averageCostPerItem: totalCost / costItems.length,
    itemCount: costItems.length,
    categoryBreakdown,
  };
}

export function computeMarginMetrics(revenue = 0, cost = 0) {
  const grossProfit = revenue - cost;
  const marginPercent = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
  return {
    grossProfit,
    marginPercent: Math.round(marginPercent * 100) / 100,
    costOfGoodsSold: cost,
  };
}

export function buildKpiDashboard({ transactions = [], costItems = [], tenantId = 'production' } = {}) {
  const revenue = computeRevenueMetrics(transactions);
  const costs = computeCostMetrics(costItems);
  const margins = computeMarginMetrics(revenue.totalRevenue, costs.totalCost);

  return {
    tenantId,
    generatedAt: new Date().toISOString(),
    revenue,
    costs,
    margins,
    summary: {
      kpiStatus: margins.marginPercent > 20 ? 'healthy' : margins.marginPercent > 0 ? 'acceptable' : 'at_risk',
      periodDays: 30,
    },
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Content-Type, Authorization'
  );

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const authHeader = req.headers.authorization;
    const decoded = await verifyBearerToken(authHeader);
    if (!decoded) return res.status(401).json({ error: 'Unauthorized' });
    await enforceModuleAccess(decoded || {}, 'analytics', 'metrics');
    const tenantId = decoded?.tenantId || decoded?.tenant_id || 'production';

    if (req.method === 'GET') {
      const sampleDashboard = buildKpiDashboard({
        transactions: [
          { amount: 5000, currency: 'ETB' },
          { amount: 3200, currency: 'ETB' },
          { amount: 7800, currency: 'ETB' },
        ],
        costItems: [
          { amount: 2100, category: 'cogs' },
          { amount: 800, category: 'overhead' },
        ],
        tenantId,
      });
      return res.status(200).json({ success: true, tenantId, dashboard: sampleDashboard });
    }

    if (req.method === 'POST') {
      const { transactions, costItems } = req.body || {};
      if (!Array.isArray(transactions) || !Array.isArray(costItems)) {
        return res.status(400).json({ error: 'Missing transactions or costItems arrays' });
      }
      const dashboard = buildKpiDashboard({ transactions, costItems, tenantId });
      return res.status(200).json({ success: true, tenantId, dashboard });
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (err) {
    console.error('[analytics/metrics] error', err?.message || err);
    return res.status(500).json({ success: false, error: err?.message || 'Internal' });
  }
}
