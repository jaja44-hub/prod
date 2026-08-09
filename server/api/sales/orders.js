import { verifyBearerToken } from '../lib/firebaseAdmin.js';
import { enforceModuleAccess } from '../lib/policyOrchestrator.js';
import { getPool, tableExists } from '../../../api/lib/shared.js';

export async function getOrders(tenantId = 'production') {
  const pool = getPool('accounting');
  if (!(await tableExists('sales_orders', pool))) {
    return [];
  }
  const result = await pool.query(
    `SELECT id, order_number, customer_name, customer_email, order_date,
            total_amount, status, payment_status, created_at
     FROM sales_orders WHERE tenant_id = $1 ORDER BY order_date DESC LIMIT 100`,
    [tenantId]
  );
  return result.rows.map((row) => ({
    id: row.id,
    name: row.order_number,
    orderNumber: row.order_number,
    customerName: row.customer_name,
    totalAmount: Number(row.total_amount || 0),
    state: row.status,
    orderDate: row.order_date,
    createdAt: row.created_at,
    tenantId,
  }));
}

export async function createOrder(tenantId = 'production', payload = {}) {
  const pool = getPool('accounting');
  if (!(await tableExists('sales_orders', pool))) {
    throw new Error('sales_orders table not provisioned');
  }
  const total = (payload.lines || []).reduce(
    (s, l) => s + Number(l.quantity || 0) * Number(l.unitPrice || 0),
    0
  );
  const result = await pool.query(
    `INSERT INTO sales_orders (tenant_id, order_number, customer_name, order_date, total_amount, status)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, order_number, customer_name, order_date, total_amount, status, created_at`,
    [
      tenantId,
      payload.orderNumber || `SO-${Date.now()}`,
      payload.customerName || null,
      payload.orderDate || new Date().toISOString(),
      total,
      payload.status || 'draft',
    ]
  );
  return { source: 'neon', order: result.rows[0], id: result.rows[0].id };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  try {
    const decoded = await verifyBearerToken(req);
    if (!decoded) return res.status(401).json({ error: 'Unauthorized' });
    await enforceModuleAccess(decoded || {}, 'sales', 'orders');
    const tenantId = decoded?.tenantId || decoded?.tenant_id || 'production';

    if (req.method === 'GET') {
      const data = await getOrders(tenantId);
      return res.status(200).json({ success: true, data, meta: { tenantId } });
    }

    if (req.method === 'POST') {
      const payload = req.body || {};
      const result = await createOrder(tenantId, payload);
      return res.status(201).json({ success: true, data: result.order, meta: { tenantId, source: result.source } });
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (err) {
    console.error('[sales/orders] error', err?.message || err);
    return res.status(500).json({ success: false, error: err?.message || 'Internal' });
  }
}
