import {
  applyCors,
  getPool,
  resolveTenantId,
  routeSegments,
  jsonError,
  tableExists,
  isDbUnavailable,
} from './lib/shared.js';

export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  const tenantId = resolveTenantId(req);
  const segments = routeSegments(req, 'purchase');
  const resource = segments[0] || '';

  try {
    if (resource === 'orders') return await handleOrders(req, res, tenantId, segments.slice(1));
    if (resource === 'suppliers') return await handleSuppliers(req, res, tenantId, segments.slice(1));
    if (resource === 'requisitions') return await handleRequisitions(req, res, tenantId, segments.slice(1));
    if (resource === 'receipts') return await handleReceipts(req, res, tenantId, segments.slice(1));
    if (resource === 'budget') return await handleBudget(req, res, tenantId, segments.slice(1));
    if (resource === 'suppliers-performance') return await handleSupplierPerformance(req, res, tenantId);
    return jsonError(res, 404, `Unknown purchase route: ${resource || '(empty)'}`);
  } catch (error) {
    console.error('[api/purchase]', error);
    if (isDbUnavailable(error)) {
      return res.status(200).json({ success: true, data: [], count: 0, degraded: true });
    }
    return jsonError(res, 500, error.message || 'Internal server error');
  }
}

async function handleOrders(req, res, tenantId, rest) {
  const pool = getPool('procurement');
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
              po_date, po_date AS order_date, expected_delivery_date, total_amount, status, notes, created_at, items
       FROM purchase_orders WHERE tenant_id = $1 AND id = $2`,
      [tenantId, rest[0]]
    );
    if (!result.rows[0]) return jsonError(res, 404, 'Purchase order not found');
    return res.status(200).json({ success: true, data: result.rows[0] });
  }
  if (req.method === 'POST' && rest.length === 0) {
    const { supplier_id, expected_delivery_date, notes, items } = req.body || {};
    const supplierResult = await pool.query('SELECT name FROM suppliers WHERE id = $1 AND tenant_id = $2', [supplier_id, tenantId]);
    const supplier_name = supplierResult.rows[0]?.name || 'Unknown Supplier';
    
    // Calculate total amount from items (assuming {quantity, unit_price})
    const total_amount = Array.isArray(items) ? items.reduce((sum, item) => sum + ((item.quantity || 0) * (item.unit_price || 0)), 0) : 0;
    const po_number = `PO-${Date.now().toString().slice(-6)}`;

    const result = await pool.query(
      `INSERT INTO purchase_orders (
        tenant_id, po_number, supplier_id, supplier_name, po_date, 
        expected_delivery_date, total_amount, status, notes, items
      ) VALUES ($1, $2, $3, $4, CURRENT_DATE, $5, $6, 'draft', $7, $8) RETURNING *`,
      [tenantId, po_number, supplier_id, supplier_name, expected_delivery_date, total_amount, notes, JSON.stringify(items || [])]
    );
    return res.status(201).json({ success: true, data: result.rows[0] });
  }
  if (req.method === 'POST' && rest.length === 2) {
    const [orderId, action] = rest;
    if (action === 'approve') {
      const result = await pool.query(
        `UPDATE purchase_orders SET status = 'purchase' WHERE tenant_id = $1 AND id = $2 RETURNING *`,
        [tenantId, orderId]
      );
      if (!result.rows[0]) return jsonError(res, 404, 'Purchase order not found');
      return res.status(200).json({ success: true, data: result.rows[0] });
    }
    if (action === 'send') {
      const result = await pool.query(
        `UPDATE purchase_orders SET status = 'sent' WHERE tenant_id = $1 AND id = $2 RETURNING *`,
        [tenantId, orderId]
      );
      if (!result.rows[0]) return jsonError(res, 404, 'Purchase order not found');
      return res.status(200).json({ success: true, data: result.rows[0] });
    }
  }
  return jsonError(res, 405, 'Method not allowed');
}

async function handleSuppliers(req, res, tenantId, rest) {
  const pool = getPool('procurement');
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
  if (req.method === 'POST' && rest.length === 0) {
    const { supplier_code, name, email, phone, city, country, active } = req.body || {};
    const supplierCode = supplier_code || `SUP-${Date.now().toString().slice(-6)}`;
    const result = await pool.query(
      `INSERT INTO suppliers (tenant_id, supplier_code, name, email, phone, city, country, active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [tenantId, supplierCode, name, email, phone, city, country, active !== false]
    );
    return res.status(201).json({ success: true, data: result.rows[0] });
  }
  if (req.method === 'PUT' && rest.length === 1) {
    const { name, email, phone, city, country, active } = req.body || {};
    const result = await pool.query(
      `UPDATE suppliers SET name = COALESCE($2, name), email = COALESCE($3, email), phone = COALESCE($4, phone),
         city = COALESCE($5, city), country = COALESCE($6, country), active = COALESCE($7, active)
       WHERE tenant_id = $1 AND id = $8 RETURNING *`,
      [tenantId, name, email, phone, city, country, active, rest[0]]
    );
    if (!result.rows[0]) return jsonError(res, 404, 'Supplier not found');
    return res.status(200).json({ success: true, data: result.rows[0] });
  }
  return jsonError(res, 405, 'Method not allowed');
}

async function handleRequisitions(req, res, tenantId, rest) {
  const pool = getPool('procurement');
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
  if (req.method === 'POST' && rest.length === 0) {
    const { requested_by, requested_by_name, total_amount, expected_delivery_date, priority, items } = req.body || {};
    const requisitionNumber = `REQ-${Date.now().toString().slice(-6)}`;
    const result = await pool.query(
      `INSERT INTO purchase_requisitions (
        tenant_id, requisition_number, requisition_date, requested_by, requested_by_name,
        total_amount, expected_delivery_date, priority, status, items
      ) VALUES ($1, $2, CURRENT_DATE, $3, $4, $5, $6, $7, 'pending', $8) RETURNING *`,
      [tenantId, requisitionNumber, requested_by, requested_by_name, total_amount, expected_delivery_date, priority, JSON.stringify(items || [])]
    );
    return res.status(201).json({ success: true, data: result.rows[0] });
  }
  if (req.method === 'POST' && rest.length === 2) {
    const [requisitionId, action] = rest;
    if (action === 'approve') {
      // Update budget utilization when requisition is approved
      const requisition = await pool.query(
        'SELECT total_amount FROM purchase_requisitions WHERE tenant_id = $1 AND id = $2',
        [tenantId, requisitionId]
      );
      if (!requisition.rows[0]) return jsonError(res, 404, 'Requisition not found');
      
      const amount = Number(requisition.rows[0].total_amount) || 0;
      
      // Update budget committed amount
      await pool.query(
        `UPDATE budgets SET committed_amount = committed_amount + $1 WHERE tenant_id = $2`,
        [amount, tenantId]
      );
      
      const result = await pool.query(
        `UPDATE purchase_requisitions SET status = 'approved' WHERE tenant_id = $1 AND id = $2 RETURNING *`,
        [tenantId, requisitionId]
      );
      return res.status(200).json({ success: true, data: result.rows[0] });
    }
    if (action === 'reject') {
      const result = await pool.query(
        `UPDATE purchase_requisitions SET status = 'rejected' WHERE tenant_id = $1 AND id = $2 RETURNING *`,
        [tenantId, requisitionId]
      );
      if (!result.rows[0]) return jsonError(res, 404, 'Requisition not found');
      return res.status(200).json({ success: true, data: result.rows[0] });
    }
  }
  return jsonError(res, 405, 'Method not allowed');
}

async function handleReceipts(req, res, tenantId, rest) {
  const pool = getPool('procurement');
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
  if (req.method === 'POST' && rest.length === 0) {
    const { po_id, received_by, received_by_name, quantity_received, quantity_accepted, quantity_rejected, notes, items } = req.body || {};
    const receiptNumber = `RCPT-${Date.now().toString().slice(-6)}`;
    const result = await pool.query(
      `INSERT INTO warehouse_receipts (
        tenant_id, receipt_number, po_id, received_by, received_by_name,
        quantity_received, quantity_accepted, quantity_rejected, status, notes, items
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', $9, $10) RETURNING *`,
      [tenantId, receiptNumber, po_id, received_by, received_by_name, quantity_received, quantity_accepted, quantity_rejected, notes, JSON.stringify(items || [])]
    );
    return res.status(201).json({ success: true, data: result.rows[0] });
  }
  if (req.method === 'POST' && rest.length === 2) {
    const [receiptId, action] = rest;
    if (action === 'complete') {
      // Update budget actual amount when receipt is completed
      const receipt = await pool.query(
        'SELECT po_id, quantity_accepted FROM warehouse_receipts WHERE tenant_id = $1 AND id = $2',
        [tenantId, receiptId]
      );
      if (!receipt.rows[0]) return jsonError(res, 404, 'Receipt not found');
      
      const poId = receipt.rows[0].po_id;
      const quantityAccepted = Number(receipt.rows[0].quantity_accepted) || 0;
      
      // Get PO total amount
      const po = await pool.query(
        'SELECT total_amount FROM purchase_orders WHERE tenant_id = $1 AND id = $2',
        [tenantId, poId]
      );
      
      if (po.rows[0]) {
        const poAmount = Number(po.rows[0].total_amount) || 0;
        
        // Update budget actual amount
        await pool.query(
          `UPDATE budgets SET actual_amount = actual_amount + $1 WHERE tenant_id = $2`,
          [poAmount, tenantId]
        );
      }
      
      const result = await pool.query(
        `UPDATE warehouse_receipts SET status = 'completed' WHERE tenant_id = $1 AND id = $2 RETURNING *`,
        [tenantId, receiptId]
      );
      
      // Update PO status to received
      await pool.query(
        `UPDATE purchase_orders SET status = 'received' WHERE tenant_id = $1 AND id = $2`,
        [tenantId, poId]
      );
      
      return res.status(200).json({ success: true, data: result.rows[0] });
    }
  }
  return jsonError(res, 405, 'Method not allowed');
}

async function handleBudget(req, res, tenantId, rest) {
  if (rest[0] === 'utilization' && req.method === 'GET') {
    const pool = getPool('procurement');
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
