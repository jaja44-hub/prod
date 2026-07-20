import { applyCors, getPool, resolveTenantId, routeSegments, jsonError, tableExists, isDbUnavailable, FALLBACK_DASHBOARD_METRICS } from './lib/shared.js';

async function safeScalar(pool, query, params, field, fallback = 0) {
  try {
    const result = await pool.query(query, params);
    const value = result.rows[0]?.[field];
    return value === null || value === undefined ? fallback : value;
  } catch {
    return fallback;
  }
}

export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  const tenantId = resolveTenantId(req);
  const segments = routeSegments(req, 'dashboard');
  const resource = segments[0] || 'metrics';

  if (resource !== 'metrics' || req.method !== 'GET') {
    return jsonError(res, 404, 'Dashboard route not found');
  }

  try {
    const pool = getPool();

    const revenue = await safeScalar(
      pool,
      `SELECT COALESCE(SUM(total_amount), 0) AS total_revenue FROM purchase_orders
       WHERE tenant_id = $1 AND status IN ('approved', 'sent', 'completed')`,
      [tenantId],
      'total_revenue',
      0
    );

    const orders = await safeScalar(
      pool,
      `SELECT COUNT(*)::int AS total_orders FROM purchase_orders WHERE tenant_id = $1`,
      [tenantId],
      'total_orders',
      0
    );

    let pipelineValue = 0;
    if (await tableExists('crm_opportunities')) {
      pipelineValue = await safeScalar(
        pool,
        `SELECT COALESCE(SUM(expected_value), 0) AS pipeline_value FROM crm_opportunities
         WHERE tenant_id = $1 AND status IN ('prospecting', 'qualification', 'proposal')`,
        [tenantId],
        'pipeline_value',
        0
      );
    }

    const warehouseReadyToPick = await safeScalar(
      pool,
      `SELECT COUNT(*)::int AS ready_to_pick FROM warehouse_receipts WHERE tenant_id = $1 AND status = 'pending'`,
      [tenantId],
      'ready_to_pick',
      0
    );

    const receivables = await safeScalar(
      pool,
      `SELECT COALESCE(SUM(total_credit), 0) AS total_receivable FROM journal_entries
       WHERE tenant_id = $1 AND entry_type = 'SALES_INVOICE'`,
      [tenantId],
      'total_receivable',
      0
    );

    const payables = await safeScalar(
      pool,
      `SELECT COALESCE(SUM(total_debit), 0) AS total_payable FROM journal_entries
       WHERE tenant_id = $1 AND entry_type = 'PURCHASE_ORDER'`,
      [tenantId],
      'total_payable',
      0
    );

    const metrics = {
      revenue: Number(revenue) || 0,
      orders: Number(orders) || 0,
      pipelineValue: Number(pipelineValue) || 0,
      warehouseReadyToPick: Number(warehouseReadyToPick) || 0,
      receivables: Number(receivables) || 0,
      payables: Number(payables) || 0,
      salesScore: 70,
      crmScore: 62,
      purchaseScore: 58,
      warehouseScore: 65,
      financeScore: 72,
    };

    return res.status(200).json({ success: true, data: metrics });
  } catch (error) {
    console.error('[api/dashboard]', error);
    if (isDbUnavailable(error)) {
      return res.status(200).json({ success: true, data: FALLBACK_DASHBOARD_METRICS, degraded: true });
    }
    return jsonError(res, 500, error.message || 'Internal server error');
  }
}
