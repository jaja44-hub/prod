import { applyCors, getPool, requireAuth, resolveTenantId, routeSegments, jsonError, tableExists, isDbUnavailable } from './lib/shared.js';

export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  const auth = await requireAuth(req, res);
  if (!auth.ok) return;
  const tenantId = auth.tenantId;
  const segments = routeSegments(req, 'sales');
  const resource = segments[0] || '';

  try {
    if (resource === 'orders') return await handleOrders(req, res, tenantId, segments.slice(1));
    if (resource === 'customers') return await handleCustomers(req, res, tenantId, segments.slice(1));
    if (resource === 'requisitions') return await handleRequisitions(req, res, tenantId, segments.slice(1));
    return jsonError(res, 404, `Unknown sales route: ${resource || '(empty)'}`);
  } catch (error) {
    console.error('[api/sales]', error);
    if (isDbUnavailable(error)) {
      return res.status(200).json({ success: true, data: [], count: 0, degraded: true });
    }
    return jsonError(res, 500, error.message || 'Internal server error');
  }
}

async function handleOrders(req, res, tenantId, rest) {
  const pool = getPool();
  if (!(await tableExists('sales_orders', pool))) {
    if (req.method === 'GET') {
      return res.status(200).json({ success: true, data: [], count: 0, note: 'sales_orders table not provisioned' });
    }
    return jsonError(res, 501, 'Sales orders not provisioned in Neon');
  }
  if (req.method === 'GET' && rest.length === 0) {
    const result = await pool.query(
      `SELECT id, order_number, customer_id, customer_name, order_date, delivery_date,
              total_amount, status, payment_status, notes, created_at
       FROM sales_orders WHERE tenant_id = $1 ORDER BY order_date DESC LIMIT 100`,
      [tenantId]
    );
    return res.status(200).json({ success: true, data: result.rows, count: result.rows.length });
  }
  return jsonError(res, 405, 'Method not allowed');
}

async function handleCustomers(req, res, tenantId, rest) {
  const pool = getPool();
  if (req.method === 'GET' && rest.length === 0) {
    const { search } = req.query;
    let query = `SELECT id, customer_code, name, email, phone, city, country, credit_limit, active, created_at
                 FROM customers WHERE tenant_id = $1`;
    const params = [tenantId];
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (name ILIKE $${params.length} OR email ILIKE $${params.length})`;
    }
    query += ' ORDER BY name ASC LIMIT 100';
    const result = await pool.query(query, params);
    return res.status(200).json({ success: true, data: result.rows, count: result.rows.length });
  }
  if (req.method === 'GET' && rest.length === 1) {
    const result = await pool.query('SELECT * FROM customers WHERE tenant_id = $1 AND id = $2', [
      tenantId,
      rest[0],
    ]);
    if (!result.rows[0]) return jsonError(res, 404, 'Customer not found');
    return res.status(200).json({ success: true, data: result.rows[0] });
  }
  if (req.method === 'POST' && rest.length === 0) {
    const { customer_code, name, email, phone, city, country, credit_limit } = req.body || {};
    const result = await pool.query(
      `INSERT INTO customers (tenant_id, customer_code, name, email, phone, city, country, credit_limit, active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true) RETURNING *`,
      [tenantId, customer_code, name, email, phone, city, country, credit_limit || 0]
    );
    return res.status(201).json({ success: true, data: result.rows[0] });
  }
  return jsonError(res, 405, 'Method not allowed');
}

async function handleRequisitions(req, res, tenantId, rest) {
  const pool = getPool('procurement');
  if (req.method === 'GET' && rest.length === 0) {
    const { status, module } = req.query;
    let query = `SELECT id, requisition_number, requisition_date, requested_by, requested_by_name, 
                        module, module_reference, status, total_amount, expected_delivery_date, 
                        priority, notes, created_at
                 FROM purchase_requisitions WHERE tenant_id = $1`;
    const params = [tenantId];
    if (module) {
      params.push(module);
      query += ` AND module = $${params.length}`;
    }
    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }
    query += ' ORDER BY requisition_date DESC LIMIT 100';
    const result = await pool.query(query, params);
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
  if (req.method === 'POST' && rest.length === 0) {
    const { 
      requested_by, 
      requested_by_name, 
      module = 'sales',
      module_reference,
      total_amount, 
      expected_delivery_date, 
      priority = 'normal', 
      notes,
      items = [] 
    } = req.body || {};
    
    const lines = Array.isArray(items) ? items : [];
    const computed_total = lines.reduce(
      (sum, item) => sum + (Number(item.quantity || 0) * Number(item.unit_price || 0)),
      0
    );
    const amount = Number(total_amount) > 0 ? Number(total_amount) : computed_total;
    const requisitionNumber = `REQ-${module.toUpperCase().slice(0,3)}-${Date.now().toString().slice(-6)}`;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const inserted = await client.query(
        `INSERT INTO purchase_requisitions (
          tenant_id, requisition_number, requisition_date, requested_by, requested_by_name,
          module, module_reference, total_amount, expected_delivery_date, priority, status, notes
        ) VALUES ($1, $2, CURRENT_DATE, $3, $4, $5, $6, $7, $8, $9, 'pending', $10) RETURNING *`,
        [tenantId, requisitionNumber, requested_by || 'requester', requested_by_name || requested_by || 'Requester',
         module, module_reference || null, amount, expected_delivery_date, priority, notes || null]
      );
      const req = inserted.rows[0];
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const qty = Number(line.quantity || 0);
        const price = Number(line.unit_price || 0);
        const lineTotal = Math.round(qty * price * 100) / 100;
        await client.query(
          `INSERT INTO purchase_requisition_items (
            requisition_id, line_number, product_id, product_name, quantity, unit_of_measure, unit_price
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [req.id, i + 1, line.product_id || null, line.product_name || 'Item',
           qty, line.unit_of_measure || 'EA', price]
        );
      }
      await client.query('COMMIT');
      return res.status(201).json({ success: true, data: req, count: 1 });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }
  return jsonError(res, 405, 'Method not allowed');
}
