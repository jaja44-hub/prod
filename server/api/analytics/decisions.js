import { verifyBearerToken } from '../lib/firebaseAdmin.js';
import { enforceModuleAccess } from '../lib/policyOrchestrator.js';

export function suggestReorderQuantity(currentStock = 0, reorderPoint = 10, moq = 10) {
  const stock = Number(currentStock || 0);
  const orderTarget = Math.max(stock * 10, 0);
  let suggestedQuantity = Math.max(0, orderTarget - stock);
  const minOrder = Number(moq || 1);

  if (minOrder > 1 && suggestedQuantity > 0) {
    suggestedQuantity = Math.ceil(suggestedQuantity / minOrder) * minOrder;
  }

  const ratio = stock > 0 ? stock / Math.max(orderTarget, 1) : 0;
  let urgency = 'normal';
  if (ratio < 0.05) urgency = 'critical';
  else if (ratio < 0.15) urgency = 'high';

  return {
    currentStock: stock,
    reorderPoint: orderTarget,
    suggestedQuantity,
    shouldReorder: suggestedQuantity > 0,
    urgency,
  };
}

export function analyzeVariance(budget = 0, actual = 0) {
  const target = Number(budget || 0);
  const real = Number(actual || 0);
  const variance = real - target;
  const variancePercent = target ? Number(((variance / target) * 100).toFixed(2)) : 0;
  let status = 'on_track';
  if (Math.abs(variancePercent) > 5) {
    status = variance > 0 ? 'over' : 'under';
  }
  return { variance, variancePercent, status };
}

export function buildBudgetAnalysis(items = []) {
  const normalized = Array.isArray(items) ? items : [];
  const lineItems = normalized.map((item) => {
    const budgeted = Number(item?.budgeted || 0);
    const actual = Number(item?.actual || 0);
    const variance = actual - budgeted;
    const variancePercent = budgeted ? Number(((variance / budgeted) * 100).toFixed(2)) : 0;
    let status = 'on_track';
    if (Math.abs(variancePercent) > 5) {
      status = variance > 0 ? 'over' : 'under';
    }
    return {
      category: item?.name || item?.category || 'Uncategorized',
      budgeted,
      actual,
      variancePercent,
      status,
    };
  });

  const totalBudget = lineItems.reduce((sum, item) => sum + item.budgeted, 0);
  const totalActual = lineItems.reduce((sum, item) => sum + item.actual, 0);
  const totalVariance = totalBudget ? Number((((totalActual - totalBudget) / totalBudget) * 100).toFixed(2)) : 0;
  let status = 'on_track';
  if (Math.abs(totalVariance) > 5) {
    status = totalVariance > 0 ? 'over' : 'under';
  }
  return {
    totalBudget,
    totalActual,
    totalVariance,
    status,
    items: lineItems,
    overallVariance: { totalVariance, status },
  };
}

function buildSampleReorderSuggestions() {
  return [
    { sku: 'PROD-001', currentStock: 10, reorderPoint: 100, suggestedQuantity: 90, urgency: 'high' },
    { sku: 'PROD-002', currentStock: 150, reorderPoint: 300, suggestedQuantity: 150, urgency: 'low' },
    { sku: 'PROD-003', currentStock: 5, reorderPoint: 200, suggestedQuantity: 195, urgency: 'critical' },
  ];
}

function buildSampleBudgetAnalysis() {
  return buildBudgetAnalysis([
    { name: 'Materials', budgeted: 100000, actual: 98500 },
    { name: 'Labor', budgeted: 50000, actual: 52000 },
    { name: 'Overhead', budgeted: 30000, actual: 29500 },
  ]);
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
    const tenantId = req.headers['x-tenant-id'] || 'production';

    const report = {
      reorderSuggestions: buildSampleReorderSuggestions(),
      budgetAnalysis: buildSampleBudgetAnalysis(),
    };

    if (req.method === 'GET') {
      return res.status(200).json({ success: true, tenantId, report });
    }

    const body = req.body || {};
    if (body.type === 'budget_analysis') {
      const analysis = buildBudgetAnalysis(body.payload?.items || body.payload || []);
      return res.status(200).json({ success: true, tenantId, report: { budgetAnalysis: analysis } });
    }

    if (Array.isArray(body.payload?.items)) {
      const suggestions = body.payload.items.map((item) =>
        suggestReorderQuantity(item.currentStock, item.reorderFactor, item.moq)
      );
      return res.status(200).json({ success: true, tenantId, report: { reorderSuggestions: suggestions } });
    }

    return res.status(200).json({ success: true, tenantId, report });
  } catch (err) {
    console.error('[analytics/decisions] error', err?.message || err);
    return res.status(500).json({ success: false, error: err?.message || 'Internal' });
  }
}
