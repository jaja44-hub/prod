import { applyCors, getPool, requireAuth, resolveTenantId, routeSegments, jsonError, tableExists } from './lib/shared.js';

export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  const auth = await requireAuth(req, res);
  if (!auth.ok) return;
  const tenantId = auth.tenantId;
  const segments = routeSegments(req, 'crm');
  const resource = segments[0] || '';

  try {
    if (resource === 'pipeline') return await handlePipeline(req, res, tenantId);
    if (resource === 'activity') return await handleActivity(req, res, tenantId);
    if (resource === 'opportunities') return await handleOpportunities(req, res, tenantId);
    if (resource === 'requisitions') return await handleRequisitions(req, res, tenantId, segments.slice(1));
    return jsonError(res, 404, `Unknown CRM route: ${resource || '(empty)'}`);
  } catch (error) {
    console.error('[api/crm]', error);
    return jsonError(res, 500, error.message || 'Internal server error');
  }
}

async function handlePipeline(req, res, tenantId) {
  const pool = getPool();
  if (req.method === 'GET') {
    const opportunitiesResult = await pool.query(
      `SELECT id, name, customer_name, expected_value, status, created_at
       FROM crm_opportunities WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 100`,
      [tenantId]
    );
    const leadsResult = await pool.query(
      `SELECT id, customer_code, name, email, phone, city, country, active, created_at
       FROM customers WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [tenantId]
    );

    const opportunities = opportunitiesResult.rows.map((row) => ({
      id: row.id,
      opportunityId: `opp-${row.id}`,
      dealName: row.name || 'Untitled opportunity',
      accountName: row.customer_name || 'Unknown account',
      contactName: row.customer_name || 'Unknown contact',
      stage: row.status || 'new',
      value: Number(row.expected_value) || 0,
      probability: 0,
      expectedCloseDate: row.created_at,
      createdAt: row.created_at,
    }));

    const leads = leadsResult.rows.map((row) => ({
      id: row.id,
      customerCode: row.customer_code,
      name: row.name,
      email: row.email,
      phone: row.phone,
      city: row.city,
      country: row.country,
      active: row.active,
      createdAt: row.created_at,
    }));

    const stageCounts = {};
    let totalPipelineValue = 0;
    for (const opp of opportunities) {
      const stage = String(opp.stage || 'new');
      stageCounts[stage] = (stageCounts[stage] || 0) + 1;
      totalPipelineValue += Number(opp.value) || 0;
    }

    return res.status(200).json({
      success: true,
      tenantId,
      pipeline: { leads, opportunities },
      summary: {
        leadCount: leads.length,
        opportunityCount: opportunities.length,
        totalPipelineValue,
        stageCounts,
      },
    });
  }
  if (req.method === 'POST') {
    const body = req.body || {};
    return res.status(201).json({
      success: true,
      data: {
        leadId: body.leadId || `lead-${Date.now()}`,
        company: body.company || 'Unnamed prospect',
        contact: body.contact || 'Unknown',
        stage: body.stage || 'new',
        value: Number(body.value || 0),
        owner: body.owner || 'sales_rep',
        createdAt: new Date().toISOString(),
      },
    });
  }
  return jsonError(res, 405, 'Method not allowed');
}

async function handleActivity(req, res, tenantId) {
  const pool = getPool();
  if (req.method === 'GET') {
    const opportunitiesResult = await pool.query(
      `SELECT id, name, customer_name, status, expected_value, created_at
       FROM crm_opportunities WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 5`,
      [tenantId]
    );
    const moduleEvents = opportunitiesResult.rows.map((row, idx) => ({
      id: `evt-crm-${row.id || idx + 1}`,
      moduleId: 'crm',
      action: `${row.name || row.customer_name || 'Opportunity'} is in ${row.status || 'new'} stage`,
      sourceModel: 'crm.opportunity',
      sourceId: String(row.id || idx + 1),
      ts: row.created_at || new Date().toISOString(),
    }));
    const timeline = opportunitiesResult.rows.map((row, idx) => ({
      activityId: `tl-${row.id || idx + 1}`,
      type: 'crm.opportunity',
      subject: `${row.name || row.customer_name || 'Opportunity'} moving through ${row.status || 'new'} stage`,
      linkedTo: String(row.id || idx + 1),
      contact: row.customer_name || 'CRM',
      occurredAt: row.created_at || new Date().toISOString(),
    }));
    return res.status(200).json({
      success: true,
      tenantId,
      moduleEvents,
      timeline,
      activities: timeline,
    });
  }
  if (req.method === 'POST') {
    return res.status(201).json({ success: true, data: { logged: true, ...(req.body || {}) } });
  }
  return jsonError(res, 405, 'Method not allowed');
}

async function handleOpportunities(req, res, tenantId) {
  const pool = getPool();
  if (!(await tableExists('crm_opportunities', pool))) {
    return res.status(200).json({ success: true, data: [], count: 0, note: 'crm_opportunities table not provisioned' });
  }
  if (req.method === 'GET') {
    const result = await pool.query(
      `SELECT id, name, customer_name, expected_value, status, created_at
       FROM crm_opportunities WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 100`,
      [tenantId]
    );
    return res.status(200).json({ success: true, data: result.rows, count: result.rows.length });
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
      module = 'crm',
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
