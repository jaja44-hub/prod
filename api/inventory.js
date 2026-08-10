import { applyCors, getPool, requireAuth, resolveTenantId, routeSegments, jsonError, tableExists, isDbUnavailable } from './lib/shared.js';

export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  const auth = await requireAuth(req, res);
  if (!auth.ok) return;
  const tenantId = auth.tenantId;
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
  const segments = routeSegments(req, 'inventory');
  const productId = segments[1] ? Number(segments[1]) : null;

  if (req.method === 'POST' && !productId) return await createProduct(req, res, tenantId);
  if (req.method === 'PUT' && productId) return await updateProduct(req, res, tenantId, productId);
  if (req.method === 'GET' && productId) return await getSingleProduct(req, res, tenantId, productId);
  if (req.method !== 'GET') return jsonError(res, 405, 'Method not allowed');

  const pool = getPool('analytics');
  if (!(await tableExists('inventory_products', pool))) {
    return res.status(200).json({ success: true, data: [], count: 0, note: 'inventory_products table not provisioned' });
  }
  const hasTransactions = await tableExists('inventory_transactions');
  const { search } = req.query;
  let query;
  if (hasTransactions) {
    query = `
      SELECT p.id, p.sku AS product_code, p.name,
             p.quantity, p.unit_price, p.created_at,
             COALESCE(stock.qty, 0) AS stock_quantity,
             COALESCE(stock.qty, 0) AS quantity_available
      FROM inventory_products p
      LEFT JOIN (
        SELECT product_id, SUM(quantity) AS qty
        FROM inventory_transactions
        WHERE tenant_id = $1
        GROUP BY product_id
      ) stock ON stock.product_id::text = p.id::text
      WHERE p.tenant_id = $1`;
  } else {
    query = `
      SELECT id, sku AS product_code, name,
             quantity, unit_price, created_at, 0 AS stock_quantity, 0 AS quantity_available
      FROM inventory_products WHERE tenant_id = $1`;
  }
  const params = [tenantId];
  if (search) {
    params.push(`%${search}%`);
    query += ` AND (p.name ILIKE $${params.length} OR p.sku ILIKE $${params.length})`;
  }
  query += ' ORDER BY name ASC LIMIT 100';
  const result = await pool.query(query, params);
  return res.status(200).json({ success: true, data: result.rows, count: result.rows.length });
}

async function getSingleProduct(req, res, tenantId, productId) {
  const pool = getPool('analytics');
  if (!(await tableExists('inventory_products', pool))) {
    return res.status(200).json({ success: true, data: null });
  }
  const result = await pool.query(
    `SELECT id, sku AS product_code, name, description, category, quantity, unit_price, created_at
     FROM inventory_products WHERE tenant_id = $1 AND id = $2`,
    [tenantId, productId]
  );
  if (result.rows.length === 0) return jsonError(res, 404, 'Product not found');
  return res.status(200).json({ success: true, data: result.rows[0] });
}

async function createProduct(req, res, tenantId) {
  const { product_code: sku, name, description = '', category = '', quantity = 0, unit_price = 0 } = req.body || {};
  if (!name) return jsonError(res, 400, 'Product name is required');
  const pool = getPool('analytics');
  if (!(await tableExists('inventory_products', pool))) {
    return res.status(200).json({ success: true, data: [], count: 0, note: 'inventory_products table not provisioned' });
  }
  const cols = await productColumns(pool);
  const insertCols = ['tenant_id', 'name', 'quantity', 'unit_price'];
  const values = [tenantId, name, Number(quantity || 0), Number(unit_price || 0)];
  if (sku !== undefined) { insertCols.push('sku'); values.push(sku); }
  if (cols.has('category') && category) { insertCols.push('category'); values.push(category); }
  if (cols.has('description') && description) { insertCols.push('description'); values.push(description); }
  const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
  const result = await pool.query(
    `INSERT INTO inventory_products (${insertCols.map((c) => `"${c}"`).join(', ')})
     VALUES (${placeholders})
     RETURNING id, sku AS product_code, name, description, category, quantity, unit_price`,
    values
  );
  return res.status(201).json({ success: true, data: result.rows[0] });
}

async function updateProduct(req, res, tenantId, productId) {
  const { product_code: sku, name, description, category, quantity, unit_price } = req.body || {};
  if (!name && !sku && description === undefined && category === undefined && quantity === undefined && unit_price === undefined) {
    return jsonError(res, 400, 'No fields to update');
  }
  const pool = getPool('analytics');
  if (!(await tableExists('inventory_products', pool))) {
    return res.status(200).json({ success: true, data: [], count: 0, note: 'inventory_products table not provisioned' });
  }
  const cols = await productColumns(pool);
  const sets = [];
  const params = [];
  const push = (col, val) => {
    if (val === undefined) return;
    if (!cols.has(col)) return;
    params.push(val);
    sets.push(`"${col}" = $${params.length}`);
  };
  if (name !== undefined) push('name', name);
  if (sku !== undefined) push('sku', sku);
  push('category', category);
  push('description', description);
  push('quantity', quantity === undefined ? undefined : Number(quantity));
  push('unit_price', unit_price === undefined ? undefined : Number(unit_price));
  if (sets.length === 0) return jsonError(res, 400, 'No fields to update');
  if (cols.has('updated_at')) {
    params.push(new Date());
    sets.push(`updated_at = $${params.length}`);
  }
  params.push(tenantId, productId);
  const result = await pool.query(
    `UPDATE inventory_products SET ${sets.join(', ')}
     WHERE tenant_id = $${params.length - 1} AND id = $${params.length}
     RETURNING id, sku AS product_code, name, description, category, quantity, unit_price`,
    params
  );
  if (result.rows.length === 0) return jsonError(res, 404, 'Product not found');
  return res.status(200).json({ success: true, data: result.rows[0] });
}

async function productColumns(pool, table = 'inventory_products') {
  try {
    const res = await pool.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = $1`,
      [table]
    );
    return new Set(res.rows.map((r) => r.column_name));
  } catch {
    return new Set();
  }
}

async function handleLocations(req, res, tenantId) {
  if (req.method !== 'GET') return jsonError(res, 405, 'Method not allowed');
  const pool = getPool('analytics');
  if (!(await tableExists('inventory_locations', pool))) {
    return res.status(200).json({ success: true, data: [], count: 0, note: 'inventory_locations not provisioned' });
  }
  const result = await pool.query(
    `SELECT id, name, location_type, address, created_at
     FROM inventory_locations WHERE tenant_id = $1 ORDER BY name ASC LIMIT 100`,
    [tenantId]
  );
  return res.status(200).json({ success: true, data: result.rows, count: result.rows.length });
}

async function handleWarehouse(req, res, tenantId) {
  if (req.method === 'GET') {
    const pool = getPool('procurement');
    if (!(await tableExists('warehouse_receipts', pool))) {
      return res.status(200).json({
        success: true,
        data: { workflow: { picks: [], packs: [], shipments: [] }, summary: { readyToPick: 0, totalPacks: 0, totalShipments: 0 } },
      });
    }
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
  const pool = getPool('analytics');
  if (!(await tableExists('inventory_cycle_counts', pool))) {
    return res.status(200).json({ success: true, data: [], count: 0 });
  }
  const result = await pool.query(
    `SELECT id, location_id, count_date, counted_by, status, created_at
     FROM inventory_cycle_counts WHERE tenant_id = $1 ORDER BY count_date DESC NULLS LAST LIMIT 50`,
    [tenantId]
  );
  return res.status(200).json({ success: true, data: result.rows, count: result.rows.length });
}

async function handleMovements(req, res, tenantId) {
  if (req.method !== 'GET') return jsonError(res, 405, 'Method not allowed');
  // Stock ledger lives in the analytics DB (seeded + drives product stock) —
  // read it from the same source the products stock_quantity is computed from.
  const pool = getPool('analytics');
  if (!(await tableExists('inventory_transactions', pool))) {
    return res.status(200).json({ success: true, data: [], count: 0, note: 'inventory_transactions not provisioned' });
  }
  const cols = await productColumns(pool, 'inventory_transactions');
  const parts = ['id', 'product_id', 'transaction_type', 'quantity', 'location_id', 'transaction_date', 'created_at'];
  if (cols.has('unit_cost')) parts.push('unit_cost');
  if (cols.has('reference_type')) parts.push('reference_type');
  if (cols.has('reference_id')) parts.push('reference_id');
  const result = await pool.query(
    `SELECT ${parts.join(', ')} FROM inventory_transactions WHERE tenant_id = $1 ORDER BY transaction_date DESC LIMIT 100`,
    [tenantId]
  );
  return res.status(200).json({ success: true, data: result.rows, count: result.rows.length });
}

async function handleReorder(req, res, tenantId) {
  if (req.method !== 'POST') return jsonError(res, 405, 'Method not allowed');
  // Products + live stock live in the procurement DB — read reorder signals there.
  const pool = getPool('procurement');
  if (!(await tableExists('products', pool))) {
    return res.status(200).json({ success: true, data: [], count: 0 });
  }
  const hasTransactions = await tableExists('inventory_transactions');
  const result = await pool.query(
    hasTransactions
      ? `SELECT p.id, p.sku, p.name, p.reorder_level, COALESCE(stock.qty, 0) AS on_hand
         FROM products p
         LEFT JOIN (
           SELECT product_id, SUM(quantity) AS qty FROM inventory_transactions WHERE tenant_id = $1 GROUP BY product_id
         ) stock ON stock.product_id = p.id
         WHERE p.tenant_id = $1 AND p.active = true AND COALESCE(stock.qty, 0) <= p.reorder_level
         LIMIT 20`
      : `SELECT id, sku, name, reorder_level, 0 AS on_hand FROM products WHERE tenant_id = $1 AND active = true LIMIT 20`,
    [tenantId]
  );
  return res.status(200).json({ success: true, data: result.rows, count: result.rows.length });
}
