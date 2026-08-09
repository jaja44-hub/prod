import {
  applyCors,
  getPool,
  requireAuth,
  resolveTenantId,
  routeSegments,
  jsonError,
  tableExists,
  isDbUnavailable,
} from './lib/shared.js';

export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  const auth = await requireAuth(req, res);
  if (!auth.ok) return;
  const tenantId = auth.tenantId;
  const segments = routeSegments(req, 'purchase');
  const resource = segments[0] || '';

  try {
    if (resource === 'orders') return await handleOrders(req, res, tenantId, segments.slice(1));
    if (resource === 'suppliers') return await handleSuppliers(req, res, tenantId, segments.slice(1));
    if (resource === 'requisitions') return await handleRequisitions(req, res, tenantId, segments.slice(1));
    if (resource === 'receipts') return await handleReceipts(req, res, tenantId, segments.slice(1));
    if (resource === 'budget') return await handleBudget(req, res, tenantId, segments.slice(1));
    if (resource === 'quotes') return await handleQuotes(req, res, tenantId, segments.slice(1));
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
    let query = `SELECT po.id, po.po_number, po.supplier_id, s.name as supplier_name, po.po_date, po.expected_delivery_date, po.total_amount, po.status, po.created_at
                 FROM purchase_orders po LEFT JOIN suppliers s ON po.supplier_id = s.id
                 WHERE po.tenant_id = $1`;
    const params = [tenantId];
    if (status) {
      params.push(status);
      query += ` AND po.status = $${params.length}`;
    }
    if (start_date) {
      params.push(start_date);
      // UI filters by creation date for the list
      query += ` AND po.created_at::date >= $${params.length}`;
    }
    if (end_date) {
      params.push(end_date);
      query += ` AND po.created_at::date <= $${params.length}`;
    }
    query += ' ORDER BY po.po_date DESC LIMIT 100';
    const result = await pool.query(query, params);
    return res.status(200).json({ success: true, data: result.rows, count: result.rows.length });
  }
  if (req.method === 'GET' && rest.length === 1) {
    const result = await pool.query(
      `SELECT po.*, s.name as supplier_name
       FROM purchase_orders po LEFT JOIN suppliers s ON po.supplier_id = s.id
       WHERE po.tenant_id = $1 AND po.id = $2`,
      [tenantId, rest[0]]
    );
    if (!result.rows[0]) return jsonError(res, 404, 'Purchase order not found');
    return res.status(200).json({ success: true, data: result.rows[0] });
  }
  if (req.method === 'POST' && rest.length === 0) {
    const { supplier_id, expected_delivery_date, notes, items = [] } = req.body || {};
    if (!supplier_id) return jsonError(res, 400, 'supplier_id is required');
    const supplierResult = await pool.query(
      'SELECT name, address, phone, email FROM suppliers WHERE id = $1 AND tenant_id = $2',
      [supplier_id, tenantId]
    );
    const supplier = supplierResult.rows[0];
    if (!supplier) return jsonError(res, 404, 'Seller/supplier not found');

    const lines = Array.isArray(items) ? items : [];
    const subtotal = lines.reduce(
      (sum, item) => sum + (Number(item.quantity_ordered || item.quantity || 0) * Number(item.unit_price || 0)),
      0
    );
    const vat_amount = Math.round(subtotal * 0.15 * 100) / 100;
    const total_amount = Math.round((subtotal + vat_amount) * 100) / 100;
    const po_number = `PO-${Date.now().toString().slice(-6)}`;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const inserted = await client.query(
        `INSERT INTO purchase_orders (
          tenant_id, po_number, supplier_id, supplier_name, supplier_phone, supplier_email,
          po_date, expected_delivery_date, subtotal, vat_amount, vat_rate, total_amount,
          currency, status, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_DATE, $7, $8, $9, 0.1500, $10, 'ETB', 'draft', $11)
        RETURNING *`,
        [tenantId, po_number, supplier_id, supplier.name, supplier.phone, supplier.email,
         expected_delivery_date, subtotal, vat_amount, total_amount, notes || null]
      );
      const po = inserted.rows[0];
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const qty = Number(line.quantity_ordered ?? line.quantity ?? 0);
        const price = Number(line.unit_price ?? 0);
        const lineTotal = Math.round(qty * price * 100) / 100;
        await client.query(
          `INSERT INTO purchase_order_items (
            po_id, line_number, product_id, product_name, quantity_ordered, quantity_received,
            unit_of_measure, unit_price, expected_delivery_date
          ) VALUES ($1, $2, $3, $4, $5, 0, $6, $7, $8)`,
          [po.id, i + 1, line.product_id || null, line.product_name || 'Item',
           qty, line.unit_of_measure || 'EA', price, expected_delivery_date || null]
        );
      }
      await client.query('COMMIT');
      return res.status(201).json({ success: true, data: po, count: 1 });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }
  if (req.method === 'POST' && rest.length === 2) {
    const [orderId, action] = rest;
    if (action === 'approve') {
      const result = await pool.query(
        `SELECT budget_id, total_amount, po_number FROM purchase_orders WHERE tenant_id = $1 AND id = $2`,
        [tenantId, orderId]
      );
      const poRow = result.rows[0];
      if (!poRow) return jsonError(res, 404, 'Purchase order not found');

      // S2.5 — record the purchase_order-level budget commitment when the PO is
      // approved (commitment mode = spend intent locked at PO stage).
      if (poRow.budget_id && Number(poRow.total_amount) > 0) {
        await pool.query(
          `INSERT INTO budget_commitments (
            tenant_id, budget_id, commitment_type, reference_type, reference_id,
            committed_amount, currency, status, committed_by, committed_by_name
          ) VALUES ($1, $2, 'purchase_order', 'purchase_order', $3, $4, 'ETB', 'active', $5, $5)
          ON CONFLICT DO NOTHING`,
          [tenantId, poRow.budget_id, orderId, Number(poRow.total_amount), 'system']
        );
      }

      const updated = await pool.query(
        `UPDATE purchase_orders SET status = 'purchase' WHERE tenant_id = $1 AND id = $2 RETURNING *`,
        [tenantId, orderId]
      );
      return res.status(200).json({ success: true, data: updated.rows[0] });
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
    const { search } = req.query;
    let query = `SELECT DISTINCT ON (name) id, supplier_code, name, email, phone, address,
                        city, country, active, created_at
                 FROM suppliers WHERE tenant_id = $1`;
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
    const { requested_by, requested_by_name, total_amount, expected_delivery_date, priority = 'normal', items = [] } = req.body || {};
    const lines = Array.isArray(items) ? items : [];
    const computed_total = lines.reduce(
      (sum, item) => sum + (Number(item.quantity || 0) * Number(item.unit_price || 0)),
      0
    );
    const amount = Number(total_amount) > 0 ? Number(total_amount) : computed_total;
    const requisitionNumber = `REQ-${Date.now().toString().slice(-6)}`;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const inserted = await client.query(
        `INSERT INTO purchase_requisitions (
          tenant_id, requisition_number, requisition_date, requested_by, requested_by_name,
          total_amount, expected_delivery_date, priority, status
        ) VALUES ($1, $2, CURRENT_DATE, $3, $4, $5, $6, $7, 'pending') RETURNING *`,
        [tenantId, requisitionNumber, requested_by || 'requester', requested_by_name || requested_by || 'Requester',
         amount, expected_delivery_date, priority]
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
  if (req.method === 'POST' && rest.length === 2) {
    const [requisitionId, action] = rest;
    if (action === 'approve') {
      // Load the requisition; if it has a budget_id, post a real commitment row.
      const requisition = await pool.query(
        'SELECT total_amount, budget_id, requisition_number FROM purchase_requisitions WHERE tenant_id = $1 AND id = $2',
        [tenantId, requisitionId]
      );
      if (!requisition.rows[0]) return jsonError(res, 404, 'Requisition not found');

      const reqRow = requisition.rows[0];
      const amount = Number(reqRow.total_amount) || 0;

      if (reqRow.budget_id && amount > 0) {
        await pool.query(
          `INSERT INTO budget_commitments (
            tenant_id, budget_id, commitment_type, reference_type, reference_id,
            committed_amount, currency, status, committed_by, committed_by_name
          ) VALUES ($1, $2, 'requisition', 'purchase_requisition', $3, $4, 'ETB', 'active', $5, $6)
          ON CONFLICT DO NOTHING`,
          [tenantId, reqRow.budget_id, requisitionId, amount,
           reqRow.approved_by || 'system', reqRow.approved_by_name || 'System Approver']
        );
      }

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
    const { po_id, received_by, received_by_name, quantity_received, quantity_accepted, quantity_rejected, notes, items = [] } = req.body || {};
    const receiptNumber = `RCPT-${Date.now().toString().slice(-6)}`;
    const lines = Array.isArray(items) ? items : [];
    const totalReceived = lines.reduce((s, l) => s + Number(l.quantity_received ?? l.quantity ?? 0), 0) ||
                          Number(quantity_received || 0);
    const totalAccepted = lines.reduce((s, l) => s + Number(l.quantity_accepted ?? l.quantity_received ?? 0), 0) ||
                          Number(quantity_accepted || totalAccepted);
    const totalRejected = (totalReceived - totalAccepted) || Number(quantity_rejected || 0);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const inserted = await client.query(
        `INSERT INTO warehouse_receipts (
          tenant_id, receipt_number, po_id, received_by, received_by_name,
          quantity_received, quantity_accepted, quantity_rejected, status, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', $9) RETURNING *`,
        [tenantId, receiptNumber, po_id, received_by || 'warehouse', received_by_name || received_by || 'Warehouse Clerk',
         totalReceived, totalAccepted, totalRejected, notes || null]
      );
      const receipt = inserted.rows[0];

      // Store per-line receipts from the PO items (and capture the ~5% inspection reject rate).
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const qtyReceived = Number(line.quantity_received ?? line.quantity ?? 0);
        const qtyAccepted = Number(line.quantity_accepted ?? qtyReceived);
        const qtyRejected = Math.max(0, qtyReceived - qtyAccepted);
        const unitCost = Number(line.unit_cost ?? line.unit_price ?? 0);
        await client.query(
          `INSERT INTO warehouse_receipt_items (
            receipt_id, line_number, po_item_id, product_id, product_name,
            quantity_received, quantity_accepted, quantity_rejected, unit_of_measure, unit_cost
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [receipt.id, i + 1, line.po_item_id || null, line.product_id || null,
           line.product_name || 'Item', qtyReceived, qtyAccepted, qtyRejected,
           line.unit_of_measure || 'EA', unitCost]
        );
      }
      await client.query('COMMIT');
      return res.status(201).json({ success: true, data: receipt, count: 1 });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }
  if (req.method === 'POST' && rest.length === 2) {
    const [receiptId, action] = rest;
    if (action === 'complete') {
      // Complete a warehouse receipt: post COGS/stock-ledger moves via
      // inventory_transactions from the accepted line quantities (S2.3).
      const receipt = await pool.query(
        'SELECT po_id FROM warehouse_receipts WHERE tenant_id = $1 AND id = $2',
        [tenantId, receiptId]
      );
      if (!receipt.rows[0]) return jsonError(res, 404, 'Receipt not found');

      const poId = receipt.rows[0].po_id;

      const lineRows = await pool.query(
        `SELECT product_id, quantity_accepted, unit_cost, unit_of_measure
         FROM warehouse_receipt_items WHERE receipt_id = $1 AND quantity_accepted > 0`,
        [receiptId]
      );

      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        for (const line of lineRows.rows) {
          const qty = Number(line.quantity_accepted) || 0;
          if (qty > 0) {
            await client.query(
              `INSERT INTO inventory_transactions (
                tenant_id, product_id, transaction_type, quantity, unit_cost,
                location_id, reference_type, reference_id, transaction_date
              ) VALUES ($1, $2, 'purchase_receipt', $3, $4, 'main', 'warehouse_receipt', $5, CURRENT_DATE)`,
              [tenantId, line.product_id, qty, Number(line.unit_cost) || 0, receiptId]
            );
          }
        }
        await client.query(
          `UPDATE warehouse_receipts SET status = 'completed' WHERE tenant_id = $1 AND id = $2`,
          [tenantId, receiptId]
        );
        await client.query(
          `UPDATE purchase_orders SET status = 'received', actual_delivery_date = CURRENT_DATE
           WHERE tenant_id = $1 AND id = $2`,
          [tenantId, poId]
        );
        await client.query('COMMIT');
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }

      const result = await pool.query(
        'SELECT * FROM warehouse_receipts WHERE tenant_id = $1 AND id = $2',
        [tenantId, receiptId]
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
  const pool = getPool('procurement');
  if (!(await tableExists('supplier_performance', pool))) {
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

async function handleQuotes(req, res, tenantId, rest) {
  const pool = getPool('procurement');
  if (req.method === 'GET' && rest.length === 0) {
    const result = await pool.query(
      `SELECT id, quotation_number, quotation_date, requisition_id, supplier_id, supplier_name,
              valid_until, quotation_status, subtotal, vat_amount, total_amount, currency, created_at
       FROM supplier_quotations WHERE tenant_id = $1 ORDER BY quotation_date DESC LIMIT 100`,
      [tenantId]
    );
    return res.status(200).json({ success: true, data: result.rows, count: result.rows.length });
  }
  if (req.method === 'GET' && rest.length === 1) {
    const quote = await pool.query(
      `SELECT q.*, s.name AS supplier_name
       FROM supplier_quotations q
       LEFT JOIN suppliers s ON s.id = q.supplier_id
       WHERE q.tenant_id = $1 AND q.id = $2`,
      [tenantId, rest[0]]
    );
    if (!quote.rows[0]) return jsonError(res, 404, 'Quotation not found');
    const items = await pool.query(
      `SELECT id, line_number, product_id, product_name, quantity, unit_of_measure, unit_price, total_price, lead_time_days
       FROM supplier_quotation_items WHERE quotation_id = $1 ORDER BY line_number`,
      [rest[0]]
    );
    return res.status(200).json({ success: true, data: { ...quote.rows[0], items: items.rows } });
  }
  if (req.method === 'POST' && rest.length === 0) {
    const { requisition_id, supplier_id, valid_until, payment_terms, notes, received_by, received_by_name, items = [] } = req.body || {};
    if (!supplier_id) return jsonError(res, 400, 'supplier_id is required');
    const supplierResult = await pool.query(
      'SELECT name FROM suppliers WHERE tenant_id = $1 AND id = $2',
      [tenantId, supplier_id]
    );
    const supplier = supplierResult.rows[0];
    if (!supplier) return jsonError(res, 404, 'Supplier not found');

    const lines = Array.isArray(items) ? items : [];
    const subtotal = lines.reduce(
      (sum, it) => sum + (Number(it.quantity || 0) * Number(it.unit_price || 0)),
      0
    );
    const vat_amount = Math.round(subtotal * 0.15 * 100) / 100;
    const total_amount = Math.round((subtotal + vat_amount) * 100) / 100;
    const quotationNumber = `QT-${Date.now().toString().slice(-6)}`;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const inserted = await client.query(
        `INSERT INTO supplier_quotations (
          tenant_id, quotation_number, quotation_date, requisition_id, supplier_id, supplier_name,
          valid_until, quotation_status, subtotal, vat_amount, vat_rate, total_amount, payment_terms,
          delivery_terms, notes, received_by, received_by_name
        ) VALUES ($1, $2, CURRENT_DATE, $3, $4, $5, $6, 'received', $7, $8, 0.1500, $9, $10, NULL, NULL, $11, $12)
        RETURNING *`,
        [tenantId, quotationNumber, requisition_id || null, supplier_id, supplier.name,
         valid_until, subtotal, vat_amount, total_amount, payment_terms || 30, received_by || null, received_by_name || null]
      );
      const quote = inserted.rows[0];
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        await client.query(
          `INSERT INTO supplier_quotation_items (
            quotation_id, line_number, product_id, product_name, quantity, unit_of_measure, unit_price, lead_time_days
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [quote.id, i + 1, line.product_id || null, line.product_name || 'Item',
           Number(line.quantity || 0), line.unit_of_measure || 'EA', Number(line.unit_price || 0), line.lead_time_days || null]
        );
      }
      await client.query('COMMIT');
      return res.status(201).json({ success: true, data: quote, count: 1 });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }
  if (req.method === 'POST' && rest.length === 2) {
    const [quoteId, action] = rest;
    if (action === 'select') {
      const result = await pool.query(
        `UPDATE supplier_quotations SET quotation_status = 'selected' WHERE tenant_id = $1 AND id = $2 RETURNING *`,
        [tenantId, quoteId]
      );
      if (!result.rows[0]) return jsonError(res, 404, 'Quotation not found');
      return res.status(200).json({ success: true, data: result.rows[0] });
    }
  }
  return jsonError(res, 405, 'Method not allowed');
}
