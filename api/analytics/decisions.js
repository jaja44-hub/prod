import { verifyBearerToken } from '../../server/api/lib/firebaseAdmin.js';
import { enforceModuleAccess } from '../../server/api/lib/policyOrchestrator.js';

/**
 * Predictive reorder suggestion engine.
 * Based on average daily sales and lead time.
 */
export function suggestReorderQuantity(dailyAvgSale = 0, leadTimeDays = 7, safetyStockDays = 3) {
  const reorderPoint = dailyAvgSale * (leadTimeDays + safetyStockDays);
  const economicOrderQuantity = Math.ceil(dailyAvgSale * 30);
  return {
    reorderPoint: Math.round(reorderPoint),
    recommendedQty: Math.max(economicOrderQuantity, Math.round(reorderPoint * 1.2)),
    urgency: reorderPoint > economicOrderQuantity * 0.5 ? 'high' : 'normal',
  };
}

/**
 * Variance analysis: budget vs actual comparison.
 */
export function analyzeVariance(budgeted = 0, actual = 0) {
  const variance = actual - budgeted;
  const variancePercent = budgeted > 0 ? (variance / budgeted) * 100 : 0;
  return {
    variance,
    variancePercent: Math.round(variancePercent * 100) / 100,
    status: Math.abs(variancePercent) < 5 ? 'on_track' : variancePercent > 0 ? 'over' : 'under',
  };
}

/**
 * Budget vs actual comparison report.
 */
export function buildBudgetAnalysis(lineItems = []) {
  if (lineItems.length === 0) {
    return { totalBudget: 0, totalActual: 0, itemCount: 0, overallVariance: { variance: 0, variancePercent: 0, status: 'on_track' } };
  }

  const analysis = lineItems.map((item) => ({
    ...item,
    ...analyzeVariance(item.budgeted, item.actual),
  }));

  const totalBudget = analysis.reduce((sum, item) => sum + Number(item.budgeted || 0), 0);
  const totalActual = analysis.reduce((sum, item) => sum + Number(item.actual || 0), 0);

  return {
    totalBudget,
    totalActual,
    itemCount: analysis.length,
    items: analysis,
    overallVariance: analyzeVariance(totalBudget, totalActual),
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
    await enforceModuleAccess(decoded || {}, 'analytics', 'decisions');
    const tenantId = decoded?.tenantId || decoded?.tenant_id || 'production';

    if (req.method === 'GET') {
      const sampleAnalysis = buildBudgetAnalysis([
        { name: 'Materials', budgeted: 50000, actual: 48500 },
        { name: 'Labor', budgeted: 30000, actual: 31200 },
        { name: 'Overhead', budgeted: 15000, actual: 14800 },
      ]);
      const reorderSample = suggestReorderQuantity(150, 7, 3);
      return res.status(200).json({
        success: true,
        tenantId,
        budgetAnalysis: sampleAnalysis,
        reorderSuggestion: reorderSample,
      });
    }

    if (req.method === 'POST') {
      const { type, payload } = req.body || {};
      if (type === 'budget_analysis') {
        if (!Array.isArray(payload)) {
          return res.status(400).json({ error: 'Invalid budget analysis payload' });
        }
        const analysis = buildBudgetAnalysis(payload);
        return res.status(200).json({ success: true, tenantId, budgetAnalysis: analysis });
      } else if (type === 'reorder_suggestion') {
        const { dailyAvgSale, leadTimeDays, safetyStockDays } = payload || {};
        const suggestion = suggestReorderQuantity(dailyAvgSale, leadTimeDays, safetyStockDays);
        return res.status(200).json({ success: true, tenantId, reorderSuggestion: suggestion });
      }
      return res.status(400).json({ error: 'Unknown decision type' });
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (err) {
    console.error('[analytics/decisions] error', err?.message || err);
    return res.status(500).json({ success: false, error: err?.message || 'Internal' });
  }
}
