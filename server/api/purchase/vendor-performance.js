import { verifyBearerToken } from '../lib/firebaseAdmin.js';
import { enforceModuleAccess } from '../lib/policyOrchestrator.js';

/**
 * Compute vendor performance metrics from supplied datasets.
 * Inputs: purchases: [{ vendorId, poId, expectedDate, receivedDate, expectedQty, receivedQty, expectedAmount, paidAmount }]
 */
export function buildSeededPurchaseData(tenantId = 'production') {
  return {
    tenantId,
    purchases: [
      { vendorId: 'ven-001', poId: 'PO-1001', expectedDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), receivedDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(), expectedQty: 120, receivedQty: 120, expectedAmount: 480000, paidAmount: 470000 },
      { vendorId: 'ven-001', poId: 'PO-1002', expectedDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(), receivedDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(), expectedQty: 90, receivedQty: 88, expectedAmount: 360000, paidAmount: 372000 },
      { vendorId: 'ven-002', poId: 'PO-1003', expectedDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(), receivedDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), expectedQty: 60, receivedQty: 60, expectedAmount: 180000, paidAmount: 180000 },
      { vendorId: 'ven-003', poId: 'PO-1004', vendorName: 'Blue Nile Packaging', expectedDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(), receivedDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(), expectedQty: 200, receivedQty: 198, expectedAmount: 95000, paidAmount: 95000 },
      { vendorId: 'ven-004', poId: 'PO-1005', vendorName: 'East Africa Freight', expectedDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), receivedDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(), expectedQty: 40, receivedQty: 40, expectedAmount: 128000, paidAmount: 131000 },
    ],
  };
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
