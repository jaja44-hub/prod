import { applyCors, getPool, resolveTenantId, routeSegments, jsonError } from './lib/shared.js';

export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  const tenantId = resolveTenantId(req);
  const segments = routeSegments(req, 'analytics');
  const resource = segments[0] || '';

  try {
    if (resource === 'metrics') return await handleMetrics(req, res, tenantId);
    if (resource === 'decisions') return await handleDecisions(req, res, tenantId);
    if (resource === 'engine') return await handleEngine(req, res, tenantId);
    return jsonError(res, 404, `Unknown analytics route: ${resource || '(empty)'}`);
  } catch (error) {
    console.error('[api/analytics]', error);
    return jsonError(res, 500, error.message || 'Internal server error');
  }
}

async function handleMetrics(req, res, tenantId) {
  const pool = getPool();
  if (req.method === 'GET') {
    const [orders, receipts, journal] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS c FROM purchase_orders WHERE tenant_id = $1`, [tenantId]).catch(() => ({ rows: [{ c: 0 }] })),
      pool.query(`SELECT COUNT(*)::int AS c FROM warehouse_receipts WHERE tenant_id = $1`, [tenantId]).catch(() => ({ rows: [{ c: 0 }] })),
      pool.query(`SELECT COUNT(*)::int AS c FROM journal_entries WHERE tenant_id = $1`, [tenantId]).catch(() => ({ rows: [{ c: 0 }] })),
    ]);
    return res.status(200).json({
      success: true,
      tenantId,
      kpis: {
        purchaseOrders: orders.rows[0]?.c || 0,
        warehouseReceipts: receipts.rows[0]?.c || 0,
        journalEntries: journal.rows[0]?.c || 0,
      },
      generatedAt: new Date().toISOString(),
    });
  }
  if (req.method === 'POST') {
    return res.status(200).json({ success: true, tenantId, received: req.body || {} });
  }
  return jsonError(res, 405, 'Method not allowed');
}

async function handleDecisions(req, res, tenantId) {
  if (req.method === 'GET') {
    return res.status(200).json({
      success: true,
      tenantId,
      decisions: [{ id: 'budget-1', title: 'Maintain procurement cadence', severity: 'neutral' }],
    });
  }
  if (req.method === 'POST') {
    return res.status(200).json({
      success: true,
      tenantId,
      type: req.body?.type || 'budget_analysis',
      recommendation: 'Continue monitoring budget utilization against purchase requisitions.',
    });
  }
  return jsonError(res, 405, 'Method not allowed');
}

async function handleEngine(req, res, tenantId) {
  if (req.method !== 'GET') return jsonError(res, 405, 'Method not allowed');
  return res.status(200).json({
    success: true,
    tenantId,
    engine: 'neon-aggregate-v1',
    status: 'ready',
  });
}
