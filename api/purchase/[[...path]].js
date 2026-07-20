import {
  applyCors,
  getPool,
  resolveTenantId,
  routeSegments,
  jsonError,
  tableExists,
} from '../lib/shared.js';

export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  const tenantId = resolveTenantId(req);
  const segments = routeSegments(req);
  const resource = segments[0] || '';

  try {
    if (resource === 'orders') return handleOrders(req, res, tenantId, segments.slice(1));
    if (resource === 'suppliers') return handleSuppliers(req, res, tenantId, segments.slice(1));
    if (resource === 'requisitions') return handleRequisitions(req, res, tenantId, segments.slice(1));
    if (resource === 'receipts') return handleReceipts(req, res, tenantId, segments.slice(1));
    if (resource === 'budget') return handleBudget(req, res, tenantId, segments.slice(1));
    if (resource === 'suppliers-performance') return handleSupplierPerformance(req, res, tenantId);
    return jsonError(res, 404, `Unknown purchase route: ${resource || '(empty)'}`);
  } catch (error) {
    console.error('[api/purchase]', error);
    return jsonError(res, 500, error.message || 'Internal server error');
  }
}

async function handleOrders(req, res, tenantId, rest) {
  const pool = getPool();
  if (req.method === 'GET' && rest.length === 0) {
    const { status, start_date, end_date } = req.query;
    let query = `
      SELECT id, po_number, po_number AS order_number, supplier_id, supplier_name,
             po_date, po_date AS order_date, expected_delivery_date, total_amount, status, notes, created_at
      FROM purchase_orders WHERE tenant_id = $1`;
    const params = [tenantId];
    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }
    if (start_date) {
      params.push(start_date);
      query += ` AND po_date >= $${params.length}`;
    }
    if (end_date) {
      params.push(end_date);
      query += ` AND po_date <= $${params.length}`;
    }
    query += ' ORDER BY po_date DESC LIMIT 100';
    const result = await pool.query(query, params);
    return res.status(200).json({ success: true, data: result.rows, count: result.rows.length });
  }
  if (req.method === 'GET' && rest.length === 1) {
    const result = await pool.query(
      `SELECT id, po_number, po_number AS order_number, supplier_id, supplier_name,
              po_date, po_date AS order_date, expected_delivery_date, total_amount, status, notes, created_at
       FROM purchase_orders WHERE tenant_id = $1 AND id = $2`,
      [tenantId, rest[0]]
    );
    if (!result.rows[0]) return jsonError(res, 404, 'Purchase order not found');
    return res.status(200).json({ success: true, data: result.rows[0] });
  }
  return jsonError(res, 405, 'Method not allowed');
}

async function handleSuppliers(req, res, tenantId, rest) {
  const pool = getPool();
  if (req.method === 'GET' && rest.length === 0) {
    const { search, active } = req.query;
    let query = `SELECT id, supplier_code, name, email, phone, city, country, active, created_at
                 FROM suppliers WHERE tenant_id = $1`;
    const params = [tenantId];
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (name ILIKE $${params.length} OR email ILIKE $${params.length})`;
    }
    if (active !== undefined) {
      params.push(active === 'true');
      query += ` AND active = $${params.length}`;
    }
    query += ' ORDER BY name ASC LIMIT 100';
    const result = await pool.query(query, params);
    return res.status(200).json({ success: true, data: result.rows, count: result.rows.length });
  }
  if (req.method === 'GET' && rest.length === 1) {
    const result = await pool.query(
      'SELECT * FROM suppliers WHERE tenant_id = $1 AND id = $2',
      [tenantId, rest[0]]
    );
    if (!result.rows[0]) return jsonError(res, 404, 'Supplier not found');
    return res.status(200).json({ success: true, data: result.rows[0] });
  }
  return jsonError(res, 405, 'Method not allowed');
}

async function handleRequisitions(req, res, tenantId, rest) {
  const pool = getPool();
  if (req.method === 'GET' && rest.length === 0) {
    const result = await pool.query(
      `SELECT id, requisition_number, requisition_date, requested_by, requested_by_name, status,
              total_amount, expected_delivery_date, priority, created_at
       FROM purchase_requisitions WHERE tenant_id = $1 ORDER BY requisition_date DESC LIMIT 100`,
      [tenantId]
    );
    return res.status(200).json({ success: true, data: result.rows, count: result.rows.length });
  }
  if (req.method === 'GET' && rest.length === 1) {
    const result = await pool.query(
      'SELECT * FROM purchase_requisitions WHERE tenant_id = $1 AND id = $2',
      [tenantId, rest[0]]
    );
    if (!result.rows[0]) return jsonError(res, 404, 'Requisition not found');
    return res.status(200).json({ success: true, data: result.rows[0] });
  }
  return jsonError(res, 405, 'Method not allowed');
}

async function handleReceipts(req, res, tenantId, rest) {
  const pool = getPool();
  if (req.method === 'GET' && rest.length === 0) {
    const result = await pool.query(
      `SELECT id, receipt_number, po_id, received_by, received_by_name, status,
              quantity_received, quantity_accepted, quantity_rejected, received_at, notes
       FROM warehouse_receipts WHERE tenant_id = $1 ORDER BY received_at DESC LIMIT 100`,
      [tenantId]
    );
    return res.status(200).json({ success: true, data: result.rows, count: result.rows.length });
  }
  if (req.method === 'GET' && rest.length === 1) {
    const result = await pool.query(
      'SELECT * FROM warehouse_receipts WHERE tenant_id = $1 AND id = $2',
      [tenantId, rest[0]]
    );
    if (!result.rows[0]) return jsonError(res, 404, 'Receipt not found');
    return res.status(200).json({ success: true, data: result.rows[0] });
  }
  return jsonError(res, 405, 'Method not allowed');
}

async function handleBudget(req, res, tenantId, rest) {
  if (rest[0] === 'utilization' && req.method === 'GET') {
    const pool = getPool();
    const result = await pool.query(
      `SELECT id, budget_code, name, budgeted_amount, allocated_amount, committed_amount, actual_amount AS spent_amount,
              available_amount, fiscal_year, fiscal_period
       FROM budgets WHERE tenant_id = $1 ORDER BY fiscal_year DESC, fiscal_period DESC LIMIT 50`,
      [tenantId]
    );
    return res.status(200).json({ success: true, data: result.rows, count: result.rows.length });
  }
  return jsonError(res, 404, 'Budget endpoint not found');
}

async function handleSupplierPerformance(req, res, tenantId) {
  if (req.method !== 'GET') return jsonError(res, 405, 'Method not allowed');
  const pool = getPool();
  if (!(await tableExists('supplier_performance'))) {
    return res.status(200).json({ success: true, data: [], count: 0 });
  }
  const result = await pool.query(
    `SELECT sp.*, s.name AS supplier_name, s.supplier_code
     FROM supplier_performance sp
     JOIN suppliers s ON s.id = sp.supplier_id AND s.tenant_id = sp.tenant_id
     WHERE sp.tenant_id = $1
     ORDER BY sp.overall_rating DESC`,
    [tenantId]
  );
  return res.status(200).json({ success: true, data: result.rows, count: result.rows.length });
}
