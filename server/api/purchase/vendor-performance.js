import { verifyBearerToken } from '../lib/firebaseAdmin.js';
import { enforceModuleAccess } from '../lib/policyOrchestrator.js';

export async function buildSeededPurchaseData(tenantId = 'production') {
  // Purchase data not yet migrated to Neon DB - return empty for Session 8 validation
  console.warn('[purchase/vendor-performance] Purchase data not available - requires Neon DB migration');
  return { purchases: [] };
}

export function computeVendorScore({ purchases = [] } = {}) {
  const byVendor = {};
  for (const p of purchases) {
    const v = p.vendorId || 'unknown';
    if (!byVendor[v]) byVendor[v] = { vendorId: v, totalOrders: 0, onTime: 0, qtyAccuracySum: 0, costVarianceSum: 0, defects: 0 };
    const rec = byVendor[v];
    rec.totalOrders += 1;
    // on-time delivery
    if (p.receivedDate && p.expectedDate) {
      const expected = new Date(p.expectedDate).getTime();
      const received = new Date(p.receivedDate).getTime();
      if (received <= expected) rec.onTime += 1;
    }
    // qty accuracy (percentage)
    if (typeof p.expectedQty !== 'undefined' && typeof p.receivedQty !== 'undefined') {
      const expectedQ = Number(p.expectedQty || 0);
      const receivedQ = Number(p.receivedQty || 0);
      const acc = expectedQ === 0 ? (receivedQ === 0 ? 1 : 0) : Math.max(0, 1 - Math.abs(receivedQ - expectedQ) / expectedQ);
      rec.qtyAccuracySum += acc;
    }
    // cost variance
    if (typeof p.expectedAmount !== 'undefined' && typeof p.paidAmount !== 'undefined') {
      const ev = Number(p.expectedAmount || 0);
      const pv = Number(p.paidAmount || 0);
      const varPct = ev === 0 ? 0 : (pv - ev) / ev;
      rec.costVarianceSum += varPct;
    }
  }

  // compute final metrics
  const results = Object.values(byVendor).map((v) => ({
    vendorId: v.vendorId,
    totalOrders: v.totalOrders,
    onTimePct: v.totalOrders ? Math.round((v.onTime / v.totalOrders) * 100) : 0,
    avgQtyAccuracy: v.totalOrders ? Number((v.qtyAccuracySum / v.totalOrders).toFixed(3)) : 0,
    avgCostVariancePct: v.totalOrders ? Number((v.costVarianceSum / v.totalOrders).toFixed(4)) : 0,
    score: Math.round(( (v.onTime / v.totalOrders) * 0.5 + (v.qtyAccuracySum / v.totalOrders) * 0.4 + (1 - Math.min(1, Math.abs(v.costVarianceSum / v.totalOrders || 0))) * 0.1) * 100),
  }));

  return { generatedAt: new Date().toISOString(), vendors: results };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });

  try {
    const decoded = await verifyBearerToken(req);
    if (!decoded) return res.status(401).json({ error: 'Unauthorized' });
    await enforceModuleAccess(decoded || {}, 'purchase', 'vendor_performance');
    const payload = req.body || {};
    const report = computeVendorScore({ purchases: payload.purchases || [] });
    return res.status(200).json({ success: true, data: report });
  } catch (err) {
    console.error('[purchase/vendor-performance] error', err?.message || err);
    return res.status(500).json({ success: false, error: err?.message || 'Internal' });
  }
}
