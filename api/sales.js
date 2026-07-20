import { applyCors, getPool, resolveTenantId, routeSegments, jsonError, tableExists, isDbUnavailable } from './lib/shared.js';

export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  const tenantId = resolveTenantId(req);
  const segments = routeSegments(req, 'sales');
  const resource = segments[0] || '';

  try {
    if (resource === 'orders') return await handleOrders(req, res, tenantId, segments.slice(1));
    if (resource === 'customers') return await handleCustomers(req, res, tenantId, segments.slice(1));
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
  if (!(await tableExists('sales_orders'))) {
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
