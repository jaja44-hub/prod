import { applyCors, getPool, requireAuth, resolveTenantId, routeSegments, jsonError, tableExists, isDbUnavailable } from './lib/shared.js';

export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  const auth = await requireAuth(req, res);
  if (!auth.ok) return;
  const tenantId = auth.tenantId;
  const segments = routeSegments(req, 'hr');
  const resource = segments[0] || '';

  try {
    if (resource === 'employees') return await handleEmployees(req, res, tenantId, segments.slice(1));
    if (resource === 'requisitions') return await handleRequisitions(req, res, tenantId, segments.slice(1));
    return jsonError(res, 404, `Unknown HR route: ${resource || '(empty)'}`);
  } catch (error) {
    console.error('[api/hr]', error);
    if (isDbUnavailable(error)) {
      return res.status(200).json({ success: true, data: [], count: 0, degraded: true });
    }
    return jsonError(res, 500, error.message || 'Internal server error');
  }
}

async function handleEmployees(req, res, tenantId, rest) {
  const pool = getPool('accounting');
  if (!(await tableExists('employees', pool))) {
    return res.status(200).json({ success: true, data: [], count: 0, note: 'employees table not provisioned' });
  }
  if (req.method === 'GET' && rest.length === 0) {
    const result = await pool.query(
      `SELECT id, employee_id, first_name, last_name, email, department, position, hire_date, salary, tax_bracket, status, created_at
       FROM employees WHERE tenant_id = $1 ORDER BY last_name, first_name ASC LIMIT 100`,
      [tenantId]
    );
    return res.status(200).json({ success: true, data: result.rows, count: result.rows.length });
  }
  if (req.method === 'GET' && rest.length === 1) {
    const result = await pool.query('SELECT * FROM employees WHERE tenant_id = $1 AND id = $2', [
      tenantId,
      rest[0],
    ]);
    if (!result.rows[0]) return jsonError(res, 404, 'Employee not found');
    return res.status(200).json({ success: true, data: result.rows[0] });
  }
  if (req.method === 'POST' && rest.length === 0) {
    const { employee_id, first_name, last_name, email, department, position, hire_date, salary, tax_bracket } =
      req.body || {};
    const result = await pool.query(
      `INSERT INTO employees (tenant_id, employee_id, first_name, last_name, email, department, position, hire_date, salary, tax_bracket, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'active') RETURNING *`,
      [tenantId, employee_id, first_name, last_name, email, department, position, hire_date, salary || 0, tax_bracket]
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
      module = 'hr',
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
