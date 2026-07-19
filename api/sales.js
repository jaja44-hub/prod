import { Pool } from 'pg';
const pool = new Pool({ connectionString: process.env.DATABASE_URL || process.env.NEON_DATABASE_URL, ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false });

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Content-Type, Authorization, X-Correlation-ID, X-Tenant-ID');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const tenantId = req.query.tenant_id || 'tenant_default';
    const path = req.url.split('?')[0];
    if (path.includes('/orders')) return handleOrders(req, res, tenantId);
    if (path.includes('/customers')) return handleCustomers(req, res, tenantId);
    res.status(404).json({ success: false, error: 'Endpoint not found' });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
}

async function handleOrders(req, res, tenantId) {
  if (req.method === 'GET') {
    const result = await pool.query(`SELECT id, order_number, customer_id, customer_name, order_date, delivery_date, total_amount, status, payment_status, notes, created_at FROM sales_orders WHERE tenant_id = $1 ORDER BY order_date DESC LIMIT 100`, [tenantId]);
    res.status(200).json({ success: true, data: result.rows, count: result.rows.length });
  } else if (req.method === 'POST') {
    const { customer_id, customer_name, order_date, delivery_date, total_amount, status, notes } = req.body;
    const result = await pool.query(`INSERT INTO sales_orders (tenant_id, customer_id, customer_name, order_date, delivery_date, total_amount, status, payment_status, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8) RETURNING *`, [tenantId, customer_id, customer_name, order_date, delivery_date, total_amount, status || 'draft', notes]);
    res.status(201).json({ success: true, data: result.rows[0] });
  } else res.status(405).json({ success: false, error: 'Method not allowed' });
}

async function handleCustomers(req, res, tenantId) {
  if (req.method === 'GET') {
    const { search } = req.query;
    let query = `SELECT id, customer_code, name, email, phone, city, country, credit_limit, balance, active, created_at FROM customers WHERE tenant_id = $1`;
    const params = [tenantId];
    if (search) { query += ` AND (name ILIKE $${params.length + 1} OR email ILIKE $${params.length + 1})`; params.push(`%${search}%`); }
    query += ` ORDER BY name ASC LIMIT 100`;
    const result = await pool.query(query, params);
    res.status(200).json({ success: true, data: result.rows, count: result.rows.length });
  } else if (req.method === 'POST') {
    const { customer_code, name, email, phone, city, country, credit_limit } = req.body;
    const result = await pool.query(`INSERT INTO customers (tenant_id, customer_code, name, email, phone, city, country, credit_limit, balance, active) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, true) RETURNING *`, [tenantId, customer_code, name, email, phone, city, country, credit_limit || 0]);
    res.status(201).json({ success: true, data: result.rows[0] });
  } else res.status(405).json({ success: false, error: 'Method not allowed' });
}
