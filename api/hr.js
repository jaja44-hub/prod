import { applyCors, getPool, resolveTenantId, routeSegments, jsonError, tableExists, isDbUnavailable } from './lib/shared.js';

export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  const tenantId = resolveTenantId(req);
  const segments = routeSegments(req, 'hr');
  const resource = segments[0] || '';

  try {
    if (resource === 'employees') return await handleEmployees(req, res, tenantId, segments.slice(1));
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
