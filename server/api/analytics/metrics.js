import { verifyBearerToken } from '../lib/firebaseAdmin.js';
import { enforceModuleAccess } from '../lib/policyOrchestrator.js';

export function computeRevenueMetrics(transactions = []) {
  const items = Array.isArray(transactions) ? transactions : [];
  const totalRevenue = items.reduce((sum, tx) => sum + Number(tx?.amount || 0), 0);
  const transactionCount = items.length;
  const currencyBreakdown = items.reduce((acc, tx) => {
    const currency = (tx?.currency || 'USD').toUpperCase();
    acc[currency] = (acc[currency] || 0) + Number(tx?.amount || 0);
    return acc;
  }, {});
  return { totalRevenue, transactionCount, currencyBreakdown };

}

export function computeCostMetrics(costItems = []) {
  const items = Array.isArray(costItems) ? costItems : [];
  const totalCost = items.reduce((sum, item) => sum + Number(item?.amount || 0), 0);
  const itemCount = items.length;
  const costByCategory = items.reduce((acc, item) => {
    const category = (item?.category || 'other').toLowerCase();
    acc[category] = (acc[category] || 0) + Number(item?.amount || 0);
    return acc;
  }, {});
  return { totalCost, itemCount, costByCategory };
}

export function computeMarginMetrics(revenue = 0, cost = 0) {
  const totalRevenue = Number(revenue || 0);
  const totalCost = Number(cost || 0);
  const grossProfit = totalRevenue - totalCost;
  const marginPercent = totalRevenue > 0 ? Number(((grossProfit / totalRevenue) * 100).toFixed(2)) : 0;
  return { grossProfit, marginPercent };
}

export function buildKpiDashboard({ transactions = [], costItems = [], tenantId = 'production' } = {}) {
  const revenue = computeRevenueMetrics(transactions);
  const cost = computeCostMetrics(costItems);
  const margin = computeMarginMetrics(revenue.totalRevenue, cost.totalCost);

  const health = {
    revenueStatus: revenue.totalRevenue >= 200000 ? 'healthy' : revenue.totalRevenue >= 100000 ? 'acceptable' : 'at_risk',
    costStatus: cost.totalCost <= 0.75 * Math.max(revenue.totalRevenue, 1) ? 'healthy' : cost.totalCost <= revenue.totalRevenue ? 'acceptable' : 'at_risk',
    marginStatus: margin.marginPercent >= 25 ? 'healthy' : margin.marginPercent >= 10 ? 'acceptable' : 'at_risk',
    overallStatus: margin.marginPercent >= 20 ? 'healthy' : margin.marginPercent >= 10 ? 'acceptable' : 'at_risk',
  };

  const report = {
    kpis: {
      totalRevenue: revenue.totalRevenue,
      transactionCount: revenue.transactionCount,
      totalCost: cost.totalCost,
      marginPercentage: margin.marginPercent,
    },
    currencyBreakdown: revenue.currencyBreakdown,
    health,
  };

  return {
    success: true,
    tenantId,
    revenue,
    cost,
    margin,
    report,
    summary: {
      kpiStatus: health.overallStatus,
    },
  };
}

function buildSampleTransactionData() {
  return [
    { amount: 120000, currency: 'ETB' },
    { amount: 85000, currency: 'ETB' },
    { amount: 15000, currency: 'USD' },
  ];
}

function buildSampleCostData() {
  return [
    { amount: 95000, category: 'cogs' },
    { amount: 30000, category: 'overhead' },
    { amount: 15000, category: 'labor' },
  ];
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
  if (!['GET', 'POST'].includes(req.method)) return res.status(405).json({ error: 'Method not allowed' });

  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    const decoded = await verifyBearerToken(authHeader);
    if (!decoded) return res.status(401).json({ error: 'Unauthorized' });
    await enforceModuleAccess(decoded || {}, 'analytics', 'metrics');
    const tenantId = decoded?.tenantId || decoded?.tenant_id || 'production';

    if (req.method === 'GET') {
      const dashboard = buildKpiDashboard({
        transactions: buildSampleTransactionData(),
        costItems: buildSampleCostData(),
        tenantId,
      });
      return res.status(200).json({ success: true, tenantId, ...dashboard });
    }

    const payload = req.body || {};
    const dashboard = buildKpiDashboard({
      transactions: payload.transactions || buildSampleTransactionData(),
      costItems: payload.costItems || buildSampleCostData(),
      tenantId,
    });
    return res.status(200).json({ success: true, tenantId, ...dashboard });
  } catch (err) {
    console.error('[analytics/metrics] error', err?.message || err);
    return res.status(500).json({ success: false, error: err?.message || 'Internal' });
  }
}
