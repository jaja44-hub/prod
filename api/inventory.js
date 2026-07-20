import { applyCors, getPool, resolveTenantId, routeSegments, jsonError, tableExists, isDbUnavailable } from './lib/shared.js';

export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  const tenantId = resolveTenantId(req);
  const segments = routeSegments(req, 'inventory');
  const resource = segments[0] || '';

  try {
    if (resource === 'products') return await handleProducts(req, res, tenantId);
    if (resource === 'locations') return await handleLocations(req, res, tenantId);
    if (resource === 'warehouse') return await handleWarehouse(req, res, tenantId);
    if (resource === 'cycle-counts') return await handleCycleCounts(req, res, tenantId);
    if (resource === 'movements') return await handleMovements(req, res, tenantId);
    if (resource === 'reorder-suggestion') return await handleReorder(req, res, tenantId);
    return jsonError(res, 404, `Unknown inventory route: ${resource || '(empty)'}`);
  } catch (error) {
    console.error('[api/inventory]', error);
    if (isDbUnavailable(error)) {
      return res.status(200).json({ success: true, data: [], count: 0, degraded: true });
    }
    return jsonError(res, 500, error.message || 'Internal server error');
  }
}

async function handleProducts(req, res, tenantId) {
  if (req.method !== 'GET') return jsonError(res, 405, 'Method not allowed');
  const pool = getPool();
  const { search } = req.query;
  let query = `
    SELECT p.id, p.sku AS product_code, p.name, p.cost_price, p.selling_price,
           p.reorder_level, p.active, p.created_at,
           COALESCE(stock.qty, 0) AS stock_quantity,
           COALESCE(stock.qty, 0) AS quantity_available
    FROM products p
    LEFT JOIN (
      SELECT product_id, SUM(quantity) AS qty
      FROM inventory_transactions
      WHERE tenant_id = $1
      GROUP BY product_id
    ) stock ON stock.product_id = p.id
    WHERE p.tenant_id = $1`;
  const params = [tenantId];
  if (search) {
    params.push(`%${search}%`);
    query += ` AND (p.name ILIKE $${params.length} OR p.sku ILIKE $${params.length})`;
  }
  query += ' ORDER BY p.name ASC LIMIT 100';
  const result = await pool.query(query, params);
  return res.status(200).json({ success: true, data: result.rows, count: result.rows.length });
}

async function handleLocations(req, res, tenantId) {
  if (req.method !== 'GET') return jsonError(res, 405, 'Method not allowed');
  const pool = getPool();
  const result = await pool.query(
    `SELECT id, location_code, location_name AS name, location_type, active, created_at
     FROM warehouse_locations WHERE tenant_id = $1 ORDER BY location_name ASC LIMIT 100`,
    [tenantId]
  );
  return res.status(200).json({ success: true, data: result.rows, count: result.rows.length });
}

async function handleWarehouse(req, res, tenantId) {
  if (req.method === 'GET') {
    const pool = getPool();
    const result = await pool.query(
      `SELECT status, COUNT(*)::int AS count FROM warehouse_receipts WHERE tenant_id = $1 GROUP BY status`,
      [tenantId]
    );
    const pending = result.rows.filter((r) => r.status === 'pending');
    const completed = result.rows.filter((r) => r.status === 'completed');
    const workflow = {
      picks: pending,
      packs: completed,
      shipments: result.rows.filter((r) => r.status === 'shipped'),
    };
    const readyToPick = pending.reduce((s, r) => s + Number(r.count || 0), 0);
    return res.status(200).json({
      success: true,
      data: {
        workflow,
        summary: {
          readyToPick,
          totalPacks: completed.reduce((s, r) => s + Number(r.count || 0), 0),
          totalShipments: workflow.shipments.reduce((s, r) => s + Number(r.count || 0), 0),
        },
      },
    });
  }
  if (req.method === 'POST') {
    return res.status(200).json({ success: true, data: { accepted: true } });
  }
  return jsonError(res, 405, 'Method not allowed');
}

async function handleCycleCounts(req, res, tenantId) {
  if (req.method !== 'GET') return jsonError(res, 405, 'Method not allowed');
  if (!(await tableExists('inventory_cycle_counts'))) {
    return res.status(200).json({ success: true, data: [], count: 0 });
  }
  const pool = getPool();
  const result = await pool.query(
    `SELECT id, product_id, location_id, counted_quantity, expected_quantity, variance, status, counted_by, counted_at
     FROM inventory_cycle_counts WHERE tenant_id = $1 ORDER BY counted_at DESC NULLS LAST LIMIT 50`,
    [tenantId]
  );
  return res.status(200).json({ success: true, data: result.rows, count: result.rows.length });
}

async function handleMovements(req, res, tenantId) {
  if (req.method !== 'GET') return jsonError(res, 405, 'Method not allowed');
  const pool = getPool();
  const result = await pool.query(
    `SELECT id, product_id, transaction_type, quantity, unit_cost, location_id, reference_type, reference_id, transaction_date, created_at
     FROM inventory_transactions WHERE tenant_id = $1 ORDER BY transaction_date DESC LIMIT 100`,
    [tenantId]
  );
  return res.status(200).json({ success: true, data: result.rows, count: result.rows.length });
}

async function handleReorder(req, res, tenantId) {
  if (req.method !== 'POST') return jsonError(res, 405, 'Method not allowed');
  const pool = getPool();
  const result = await pool.query(
    `SELECT p.id, p.sku, p.name, p.reorder_level, COALESCE(stock.qty, 0) AS on_hand
     FROM products p
     LEFT JOIN (
       SELECT product_id, SUM(quantity) AS qty FROM inventory_transactions WHERE tenant_id = $1 GROUP BY product_id
     ) stock ON stock.product_id = p.id
     WHERE p.tenant_id = $1 AND p.active = true AND COALESCE(stock.qty, 0) <= p.reorder_level
     LIMIT 20`,
    [tenantId]
  );
  return res.status(200).json({ success: true, data: result.rows, count: result.rows.length });
}
