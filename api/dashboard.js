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
    const accountingPool = getPool('accounting');
    const procurementPool = getPool('procurement');

    // Sales revenue from sales_orders table
    const revenue = await safeScalar(
      accountingPool,
      `SELECT COALESCE(SUM(total_amount), 0) AS total_revenue FROM sales_orders
       WHERE tenant_id = $1 AND status IN ('delivered', 'shipped')`,
      [tenantId],
      'total_revenue',
      0
    );

    // Total sales orders
    const salesOrders = await safeScalar(
      accountingPool,
      `SELECT COUNT(*)::int AS total_orders FROM sales_orders WHERE tenant_id = $1`,
      [tenantId],
      'total_orders',
      0
    );

    // CRM pipeline value from opportunities
    let pipelineValue = 0;
    if (await tableExists('crm_opportunities')) {
      pipelineValue = await safeScalar(
        accountingPool,
        `SELECT COALESCE(SUM(value), 0) AS pipeline_value FROM crm_opportunities
         WHERE tenant_id = $1 AND stage IN ('Qualification', 'Proposal', 'Negotiation')`,
        [tenantId],
        'pipeline_value',
        0
      );
    }

    // Warehouse ready to pick from receipts
    const warehouseReadyToPick = await safeScalar(
      procurementPool,
      `SELECT COUNT(*)::int AS ready_to_pick FROM warehouse_receipts WHERE tenant_id = $1 AND status = 'pending'`,
      [tenantId],
      'ready_to_pick',
      0
    );

    // Finance receivables from journal entries
    const receivables = await safeScalar(
      accountingPool,
      `SELECT COALESCE(SUM(amount), 0) AS total_receivable FROM journal_entries
       WHERE tenant_id = $1 AND debit_account_id IN (SELECT id FROM accounts WHERE account_type = 'asset')`,
      [tenantId],
      'total_receivable',
      0
    );

    // Finance payables from journal entries
    const payables = await safeScalar(
      accountingPool,
      `SELECT COALESCE(SUM(amount), 0) AS total_payable FROM journal_entries
       WHERE tenant_id = $1 AND credit_account_id IN (SELECT id FROM accounts WHERE account_type = 'liability')`,
      [tenantId],
      'total_payable',
      0
    );

    // Calculate dynamic scores based on actual data
    const salesScore = salesOrders > 0 ? Math.min(100, 50 + (salesOrders * 5)) : 0;
    const crmScore = pipelineValue > 0 ? Math.min(100, 40 + (pipelineValue / 10000)) : 0;
    
    // Purchase score based on PO count and budget utilization
    const purchaseOrdersCount = await safeScalar(
      procurementPool,
      `SELECT COUNT(*)::int AS po_count FROM purchase_orders WHERE tenant_id = $1`,
      [tenantId],
      'po_count',
      0
    );
    const purchaseScore = purchaseOrdersCount > 0 ? Math.min(100, 40 + (purchaseOrdersCount * 3)) : 0;
    
    // Warehouse score based on receipts processed
    const receiptsCount = await safeScalar(
      procurementPool,
      `SELECT COUNT(*)::int AS receipt_count FROM warehouse_receipts WHERE tenant_id = $1`,
      [tenantId],
      'receipt_count',
      0
    );
    const warehouseScore = receiptsCount > 0 ? Math.min(100, 40 + (receiptsCount * 4)) : 0;
    
    // Finance score based on journal entries and accounts
    const journalCount = await safeScalar(
      accountingPool,
      `SELECT COUNT(*)::int AS journal_count FROM journal_entries WHERE tenant_id = $1`,
      [tenantId],
      'journal_count',
      0
    );
    const financeScore = journalCount > 0 ? Math.min(100, 50 + (journalCount * 2)) : 0;

    const metrics = {
      revenue: Number(revenue) || 0,
      orders: Number(salesOrders) || 0,
      pipelineValue: Number(pipelineValue) || 0,
      warehouseReadyToPick: Number(warehouseReadyToPick) || 0,
      receivables: Number(receivables) || 0,
      payables: Number(payables) || 0,
      salesScore: Math.round(salesScore),
      crmScore: Math.round(crmScore),
      purchaseScore: Math.round(purchaseScore),
      warehouseScore: Math.round(warehouseScore),
      financeScore: Math.round(financeScore),
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
