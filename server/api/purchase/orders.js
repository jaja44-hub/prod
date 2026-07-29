/**
 * Purchase Order System
 * Handles purchase order creation, approval, and management
 */

const { Pool } = require('pg');
const budgetService = require('./budget');

// Database connection pool
const pool = new Pool({
 connectionString: process.env.DATABASE_URL || process.env.NEON_DATABASE_URL,
 ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

function normalizePaymentTerms(paymentTerms) {
 if (paymentTerms == null) {
   return null;
 }

 const parsed = Number(paymentTerms);
 if (!Number.isNaN(parsed)) {
   return parsed;
 }

 const digits = String(paymentTerms).match(/\d+/);
 return digits ? parseInt(digits[0], 10) : null;
}

/**
* Generate PO number
*/async function generatePONumber(tenantId) {
  const query = `
    SELECT COALESCE(MAX(CAST(SUBSTRING(po_number FROM 11) AS INTEGER)), 0) + 1 as next_number
    FROM purchase_orders
    WHERE tenant_id = $1
    AND po_number LIKE 'PO-%'
  `;
  
  try {
    const result = await pool.query(query, [tenantId]);
    const nextNumber = result.rows[0].next_number;
    const year = new Date().getFullYear();
    return `PO-${year}-${String(nextNumber).padStart(6, '0')}`;
  } catch (error) {
    console.error('Error generating PO number:', error);
    throw error;
  }
}

/**
 * Create purchase order from requisition
 */
async function createPOFromRequisition(requisitionId, poData) {
  const {
    supplier_id,
    payment_terms,
    delivery_terms,
    shipping_method,
    shipping_address,
    expected_delivery_date,
    notes,
    internal_notes,
    budget_id
  } = poData;

  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Get requisition details
    const requisitionQuery = `
      SELECT pr.*, t.tenant_id
      FROM purchase_requisitions pr
      JOIN tenants t ON pr.tenant_id = t.id
      WHERE pr.id = $1 AND pr.status = 'approved'
    `;
    const requisitionResult = await client.query(requisitionQuery, [requisitionId]);
    const requisition = requisitionResult.rows[0];
    
    if (!requisition) {
      throw new Error('Requisition not found or not approved');
    }
    
    // Get supplier details
    const supplierQuery = `
      SELECT * FROM suppliers WHERE id = $1
    `;
    const supplierResult = await client.query(supplierQuery, [supplier_id]);
    const supplier = supplierResult.rows[0];
    
    if (!supplier) {
      throw new Error('Supplier not found');
    }
    
    // Generate PO number
    const poNumber = await generatePONumber(requisition.tenant_id);
    
    // Insert PO header
    const poQuery = `
      INSERT INTO purchase_orders 
      (tenant_id, po_number, requisition_id, supplier_id, supplier_name, supplier_address,
       supplier_contact, supplier_phone, supplier_email, category_id, payment_terms,
       delivery_terms, shipping_method, shipping_address, expected_delivery_date,
       notes, internal_notes, budget_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *
    `;
     
    const poValues = [
      requisition.tenant_id,
      poNumber,
      requisitionId,
      supplier_id,
      supplier.name,
      supplier.address,
      supplier.contact_person,
      supplier.phone,
      supplier.email,
      requisition.category_id,
      normalizePaymentTerms(payment_terms) || supplier.payment_terms,
      delivery_terms,
      shipping_method,
      shipping_address,
      expected_delivery_date,
      notes,
      internal_notes,
      budget_id || null
    ];
    
    const poResult = await client.query(poQuery, poValues);
    const po = poResult.rows[0];
    
    // Get requisition items
    const itemsQuery = `
      SELECT * FROM purchase_requisition_items WHERE requisition_id = $1
    `;
    const itemsResult = await client.query(itemsQuery, [requisitionId]);
    const requisitionItems = itemsResult.rows;
    
    // Insert PO items
    for (let i = 0; i < requisitionItems.length; i++) {
      const item = requisitionItems[i];
      const poItemQuery = `
        INSERT INTO purchase_order_items 
        (po_id, line_number, requisition_item_id, product_id, product_name, product_description,
         category_id, quantity_ordered, unit_of_measure, unit_price, expected_delivery_date,
         specification, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      `;
      
      await client.query(poItemQuery, [
        po.id,
        i + 1,
        item.id,
        item.product_id,
        item.product_name,
        item.product_description,
        item.category_id,
        item.quantity,
        item.unit_of_measure,
        item.unit_price,
        item.estimated_delivery_date,
        item.specification,
        item.notes
      ]);
    }
    
    // Calculate PO totals
    const totalsQuery = `
      UPDATE purchase_orders
      SET subtotal = (SELECT COALESCE(SUM(total_price), 0) FROM purchase_order_items WHERE po_id = $1),
          vat_amount = (SELECT COALESCE(SUM(vat_amount), 0) FROM purchase_order_items WHERE po_id = $1),
          withholding_tax_amount = (SELECT COALESCE(SUM(withholding_tax_amount), 0) FROM purchase_order_items WHERE po_id = $1),
          total_amount = (SELECT COALESCE(SUM(line_total), 0) FROM purchase_order_items WHERE po_id = $1)
      WHERE id = $1
      RETURNING *
    `;
    
    const totalsResult = await client.query(totalsQuery, [po.id]);
    
    await client.query('COMMIT');
    
    return totalsResult.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating PO from requisition:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Create standalone purchase order
 */
async function createPO(poData) {
  const {
    tenant_id,
    supplier_id,
    category_id,
    payment_terms,
    delivery_terms,
    shipping_method,
    shipping_address,
    expected_delivery_date,
    notes,
    internal_notes,
    budget_id,
    items
  } = poData;

  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Get supplier details
    const supplierQuery = `
      SELECT * FROM suppliers WHERE id = $1
    `;
    const supplierResult = await client.query(supplierQuery, [supplier_id]);
    const supplier = supplierResult.rows[0];
    
    if (!supplier) {
      throw new Error('Supplier not found');
    }
    
    // Generate PO number
    const poNumber = await generatePONumber(tenant_id);
    
    // Insert PO header
    const poQuery = `
      INSERT INTO purchase_orders 
      (tenant_id, po_number, supplier_id, supplier_name, supplier_address,
       supplier_contact, supplier_phone, supplier_email, category_id, payment_terms,
       delivery_terms, shipping_method, shipping_address, expected_delivery_date,
       notes, internal_notes, budget_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *
    `;
     
    const poValues = [
      tenant_id,
      poNumber,
      supplier_id,
      supplier.name,
      supplier.address,
      supplier.contact_person,
      supplier.phone,
      supplier.email,
      category_id,
      normalizePaymentTerms(payment_terms) || supplier.payment_terms,
      delivery_terms,
      shipping_method,
      shipping_address,
      expected_delivery_date,
      notes,
      internal_notes,
      budget_id || null
    ];
    
    const poResult = await client.query(poQuery, poValues);
    const po = poResult.rows[0];
    
    // Insert PO items
    if (items && items.length > 0) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const poItemQuery = `
          INSERT INTO purchase_order_items 
          (po_id, line_number, product_id, product_name, product_description,
           category_id, quantity_ordered, unit_of_measure, unit_price, expected_delivery_date,
           specification, notes)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `;
        
        await client.query(poItemQuery, [
          po.id,
          i + 1,
          item.product_id,
          item.product_name,
          item.product_description,
          item.category_id,
          item.quantity,
          item.unit_of_measure,
          item.unit_price,
          item.expected_delivery_date,
          item.specification,
          item.notes
        ]);
      }
    }
    
    // Calculate PO totals
    const totalsQuery = `
      UPDATE purchase_orders
      SET subtotal = (SELECT COALESCE(SUM(total_price), 0) FROM purchase_order_items WHERE po_id = $1),
          vat_amount = (SELECT COALESCE(SUM(vat_amount), 0) FROM purchase_order_items WHERE po_id = $1),
          withholding_tax_amount = (SELECT COALESCE(SUM(withholding_tax_amount), 0) FROM purchase_order_items WHERE po_id = $1),
          total_amount = (SELECT COALESCE(SUM(line_total), 0) FROM purchase_order_items WHERE po_id = $1)
      WHERE id = $1
      RETURNING *
    `;
    
    const totalsResult = await client.query(totalsQuery, [po.id]);
    
    await client.query('COMMIT');
    
    return totalsResult.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating PO:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Submit PO for approval
 */
async function submitPO(poId, submitterData) {
  const { submitter_id, submitter_name } = submitterData;
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Get PO details
    const poQuery = `
      SELECT * FROM purchase_orders WHERE id = $1
    `;
    const poResult = await client.query(poQuery, [poId]);
    const po = poResult.rows[0];
    
    if (!po) {
      throw new Error('Purchase order not found');
    }
    
    if (po.status !== 'draft') {
      throw new Error(`PO is not in draft status (current: ${po.status})`);
    }
    
    // Start approval workflow
    const workflow = require('../approval/workflow');
    const workflowInstance = await workflow.startWorkflowInstance(po.tenant_id, {
      workflow_type: 'purchase_order',
      reference_type: 'purchase_order',
      reference_id: poId.toString(),
      initiator_id: submitter_id,
      initiator_name: submitter_name,
      amount: po.total_amount,
      currency: po.currency,
      description: `Purchase Order ${po.po_number}`
    });
    
    // Update PO status
    const updateQuery = `
      UPDATE purchase_orders
      SET status = 'pending', workflow_instance_id = $1
      WHERE id = $2
      RETURNING *
    `;
    const updateResult = await client.query(updateQuery, [workflowInstance.id, poId]);
    
    await client.query('COMMIT');
    
    return updateResult.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error submitting PO:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Approve PO
 */
async function approvePO(poId, approverData) {
  const { approver_id, approver_name, comments } = approverData;
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Get PO details
    const poQuery = `
      SELECT * FROM purchase_orders WHERE id = $1 FOR UPDATE
    `;
    const poResult = await client.query(poQuery, [poId]);
    const po = poResult.rows[0];
    
    if (!po) {
      throw new Error('Purchase order not found');
    }
    
    if (po.status !== 'pending') {
      throw new Error(`PO is not pending approval (current: ${po.status})`);
    }
    
    // Approve workflow stage
    const workflow = require('../approval/workflow');
    const workflowResult = await workflow.approveWorkflowStage(po.workflow_instance_id, {
      actor_id: approver_id,
      actor_name: approver_name,
      comments: comments
    });
    
    // Check if workflow is complete
    if (workflowResult.status === 'approved') {
      // Update PO status
      const updateQuery = `
        UPDATE purchase_orders
        SET status = 'approved', approved_by = $1, approved_by_name = $2, approved_at = CURRENT_TIMESTAMP
        WHERE id = $3
        RETURNING *
      `;
      const updateResult = await client.query(updateQuery, [approver_id, approver_name, poId]);
      
      await client.query('COMMIT');
      return updateResult.rows[0];
    } else {
      await client.query('COMMIT');
      return po;
    }
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error approving PO:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Send PO to supplier
 */
async function sendPOToSupplier(poId, senderData) {
  const { sender_id, sender_name } = senderData;
  
  const query = `
    UPDATE purchase_orders
    SET status = 'sent', sent_to_supplier = true, sent_at = CURRENT_TIMESTAMP
    WHERE id = $1 AND status = 'approved'
    RETURNING *
  `;
  
  try {
    const result = await pool.query(query, [poId]);
    
    if (result.rows.length === 0) {
      throw new Error('PO not found or not approved');
    }
    
    return result.rows[0];
  } catch (error) {
    console.error('Error sending PO to supplier:', error);
    throw error;
  }
}

/**
 * Acknowledge PO receipt by supplier
 */
async function acknowledgePO(poId) {
  const query = `
    UPDATE purchase_orders
    SET supplier_acknowledged = true,
        supplier_acknowledged_at = CURRENT_TIMESTAMP,
        status = 'supplier_acknowledged'
    WHERE id = $1 AND sent_to_supplier = true
    RETURNING *
  `;
  
  try {
    const result = await pool.query(query, [poId]);
    
    if (result.rows.length === 0) {
      throw new Error('PO not found or not sent to supplier');
    }
    
    return result.rows[0];
  } catch (error) {
    console.error('Error acknowledging PO:', error);
    throw error;
  }
}

/**
 * Get PO by ID
 */
async function getPO(poId) {
  const query = `
    SELECT 
      po.*,
      ec.name as category_name,
      ec.code as category_code,
      s.supplier_code,
      b.budget_code as budget_code,
      b.name as budget_name,
      b.available_amount as budget_available_amount,
      wi.status as workflow_status,
      wi.current_stage as workflow_stage
    FROM purchase_orders po
    LEFT JOIN esic_categories ec ON po.category_id = ec.id
    LEFT JOIN suppliers s ON po.supplier_id = s.id
    LEFT JOIN budgets b ON po.budget_id = b.id
    LEFT JOIN approval_workflow_instances wi ON po.workflow_instance_id = wi.id
    WHERE po.id = $1
  `;
  
  try {
    const result = await pool.query(query, [poId]);
    
    if (result.rows.length === 0) {
      throw new Error('Purchase order not found');
    }
    
    // Get PO items
    const itemsQuery = `
      SELECT 
        poi.*,
        p.sku,
        ec.name as category_name,
        pri.line_number as requisition_line_number
      FROM purchase_order_items poi
      LEFT JOIN products p ON poi.product_id = p.id
      LEFT JOIN esic_categories ec ON poi.category_id = ec.id
      LEFT JOIN purchase_requisition_items pri ON poi.requisition_item_id = pri.id
      WHERE poi.po_id = $1
      ORDER BY poi.line_number
    `;
    const itemsResult = await pool.query(itemsQuery, [poId]);
    
    return {
      ...result.rows[0],
      items: itemsResult.rows
    };
  } catch (error) {
    console.error('Error getting PO:', error);
    throw error;
  }
}

/**
 * Get POs with filtering
 */
async function getPOs(filters) {
  const {
    tenant_id,
    status = null,
    supplier_id = null,
    category_id = null,
    requisition_id = null,
    start_date = null,
    end_date = null,
    limit = 100,
    offset = 0
  } = filters;

  let query = `
    SELECT 
      po.*,
      ec.name as category_name,
      ec.code as category_code,
      s.supplier_code,
      s.name as supplier_name,
      wi.status as workflow_status
    FROM purchase_orders po
    LEFT JOIN esic_categories ec ON po.category_id = ec.id
    LEFT JOIN suppliers s ON po.supplier_id = s.id
    LEFT JOIN approval_workflow_instances wi ON po.workflow_instance_id = wi.id
    WHERE po.tenant_id = $1
  `;
  const values = [tenant_id];
  let paramCount = 1;

  if (status) {
    paramCount++;
    query += ` AND po.status = $${paramCount}`;
    values.push(status);
  }

  if (supplier_id) {
    paramCount++;
    query += ` AND po.supplier_id = $${paramCount}`;
    values.push(supplier_id);
  }

  if (category_id) {
    paramCount++;
    query += ` AND po.category_id = $${paramCount}`;
    values.push(category_id);
  }

  if (requisition_id) {
    paramCount++;
    query += ` AND po.requisition_id = $${paramCount}`;
    values.push(requisition_id);
  }

  if (start_date) {
    paramCount++;
    query += ` AND po.po_date >= $${paramCount}`;
    values.push(start_date);
  }

  if (end_date) {
    paramCount++;
    query += ` AND po.po_date <= $${paramCount}`;
    values.push(end_date);
  }

  query += ` ORDER BY po.po_date DESC, po.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
  values.push(limit, offset);

  try {
    const result = await pool.query(query, values);
    return result.rows;
  } catch (error) {
    console.error('Error getting POs:', error);
    throw error;
  }
}

/**
 * Update PO
 */
async function updatePO(poId, updateData) {
  const {
    payment_terms,
    delivery_terms,
    shipping_method,
    shipping_address,
    expected_delivery_date,
    notes,
    internal_notes,
    budget_id,
    items
  } = updateData;

  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Update PO header
    const updateQuery = `
      UPDATE purchase_orders
      SET payment_terms = COALESCE($1, payment_terms),
          delivery_terms = COALESCE($2, delivery_terms),
          shipping_method = COALESCE($3, shipping_method),
          shipping_address = COALESCE($4, shipping_address),
          expected_delivery_date = COALESCE($5, expected_delivery_date),
          notes = COALESCE($6, notes),
          internal_notes = COALESCE($7, internal_notes),
          budget_id = COALESCE($8, budget_id)
      WHERE id = $9 AND status = 'draft'
      RETURNING *
    `;
     
    const updateValues = [
      normalizePaymentTerms(payment_terms),
      delivery_terms,
      shipping_method,
      shipping_address,
      expected_delivery_date,
      notes,
      internal_notes,
      budget_id || null,
      poId
    ];
    
    const updateResult = await client.query(updateQuery, updateValues);
    
    if (updateResult.rows.length === 0) {
      throw new Error('PO not found or not in draft status');
    }
    
    // Update items if provided
    if (items && items.length > 0) {
      // Delete existing items
      for (const item of items) {
        if (item.id) {
          await client.query('DELETE FROM purchase_order_items WHERE id = $1', [item.id]);
        }
      }
      
      // Insert/update items
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        
        if (item.id) {
          // Update existing item
          const itemUpdateQuery = `
            UPDATE purchase_order_items
            SET product_id = COALESCE($1, product_id),
                product_name = COALESCE($2, product_name),
                product_description = COALESCE($3, product_description),
                category_id = COALESCE($4, category_id),
                quantity_ordered = COALESCE($5, quantity_ordered),
                unit_of_measure = COALESCE($6, unit_of_measure),
                unit_price = COALESCE($7, unit_price),
                expected_delivery_date = COALESCE($8, expected_delivery_date),
                specification = COALESCE($9, specification),
                notes = COALESCE($10, notes)
            WHERE id = $11
          `;
          await client.query(itemUpdateQuery, [
            item.product_id,
            item.product_name,
            item.product_description,
            item.category_id,
            item.quantity,
            item.unit_of_measure,
            item.unit_price,
            item.expected_delivery_date,
            item.specification,
            item.notes,
            item.id
          ]);
        } else {
          // Insert new item
          const itemInsertQuery = `
            INSERT INTO purchase_order_items 
            (po_id, line_number, product_id, product_name, product_description,
             category_id, quantity_ordered, unit_of_measure, unit_price, expected_delivery_date,
             specification, notes)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          `;
          await client.query(itemInsertQuery, [
            poId,
            i + 1,
            item.product_id,
            item.product_name,
            item.product_description,
            item.category_id,
            item.quantity,
            item.unit_of_measure,
            item.unit_price,
            item.expected_delivery_date,
            item.specification,
            item.notes
          ]);
        }
      }
    }
    
    // Recalculate totals
    const totalsQuery = `
      UPDATE purchase_orders
      SET subtotal = (SELECT COALESCE(SUM(total_price), 0) FROM purchase_order_items WHERE po_id = $1),
          vat_amount = (SELECT COALESCE(SUM(vat_amount), 0) FROM purchase_order_items WHERE po_id = $1),
          withholding_tax_amount = (SELECT COALESCE(SUM(withholding_tax_amount), 0) FROM purchase_order_items WHERE po_id = $1),
          total_amount = (SELECT COALESCE(SUM(line_total), 0) FROM purchase_order_items WHERE po_id = $1)
      WHERE id = $1
      RETURNING *
    `;
    
    const totalsResult = await client.query(totalsQuery, [poId]);
    
    await client.query('COMMIT');
    
    return totalsResult.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating PO:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Delete PO
 */
async function deletePO(poId) {
  const query = `
    DELETE FROM purchase_orders
    WHERE id = $1 AND status = 'draft'
    RETURNING *
  `;
  
  try {
    const result = await pool.query(query, [poId]);
    
    if (result.rows.length === 0) {
      throw new Error('PO not found or not in draft status');
    }
    
    return result.rows[0];
  } catch (error) {
    console.error('Error deleting PO:', error);
    throw error;
  }
}

module.exports = {
  createPOFromRequisition,
  createPO,
  submitPO,
  approvePO,
  sendPOToSupplier,
  acknowledgePO,
  getPO,
  getPOs,
  updatePO,
  deletePO
};
