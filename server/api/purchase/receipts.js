/**
 * Purchase Receipt System
 * Handles goods receipt processing and PO matching
 */

const { Pool } = require('pg');

// Database connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

/**
 * Generate receipt number
 */
async function generateReceiptNumber(tenantId) {
  const query = `
    SELECT COALESCE(MAX(CAST(SUBSTRING(receipt_number FROM 11) AS INTEGER)), 0) + 1 as next_number
    FROM warehouse_receipts
    WHERE tenant_id = $1
    AND receipt_number LIKE 'RCV-%'
  `;
  
  try {
    const result = await pool.query(query, [tenantId]);
    const nextNumber = result.rows[0].next_number;
    const year = new Date().getFullYear();
    return `RCV-${year}-${String(nextNumber).padStart(6, '0')}`;
  } catch (error) {
    console.error('Error generating receipt number:', error);
    throw error;
  }
}

/**
 * Create goods receipt from PO
 */
async function createReceiptFromPO(poId, receiptData) {
  const {
    received_by,
    received_by_name,
    received_by_role,
    delivery_location,
    notes,
    items
  } = receiptData;

  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Get PO details
    const poQuery = `
      SELECT po.*, s.name as supplier_name
      FROM purchase_orders po
      LEFT JOIN suppliers s ON po.supplier_id = s.id
      WHERE po.id = $1 AND po.status IN ('approved', 'sent')
    `;
    const poResult = await client.query(poQuery, [poId]);
    const po = poResult.rows[0];
    
    if (!po) {
      throw new Error('PO not found or not in approved/sent status');
    }
    
    // Generate receipt number
    const receiptNumber = await generateReceiptNumber(po.tenant_id);
    
    // Insert receipt header
    const receiptQuery = `
      INSERT INTO warehouse_receipts 
      (tenant_id, receipt_number, po_id, received_by, received_by_name, 
       received_by_role, category_id, delivery_location, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    
    const receiptValues = [
      po.tenant_id,
      receiptNumber,
      poId,
      received_by,
      received_by_name,
      received_by_role,
      po.category_id,
      delivery_location,
      notes
    ];
    
    const receiptResult = await client.query(receiptQuery, receiptValues);
    const receipt = receiptResult.rows[0];
    
    // Insert receipt items
    if (items && items.length > 0) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        
        // Get corresponding PO item
        const poItemQuery = `
          SELECT * FROM purchase_order_items 
          WHERE po_id = $1 AND (id = $2 OR line_number = $3)
        `;
        const poItemResult = await client.query(poItemQuery, [poId, item.po_item_id, item.po_line_number]);
        const poItem = poItemResult.rows[0];
        
        if (!poItem) {
          throw new Error(`PO item not found for line ${i + 1}`);
        }
        
        const receiptItemQuery = `
          INSERT INTO warehouse_receipt_items 
          (receipt_id, line_number, po_item_id, product_id, product_name, 
           product_description, category_id, quantity_received, quantity_accepted, 
           quantity_rejected, unit_of_measure, unit_cost, specification, notes)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          RETURNING *
        `;
        
        await client.query(receiptItemQuery, [
          receipt.id,
          i + 1,
          poItem.id,
          poItem.product_id,
          poItem.product_name,
          poItem.product_description,
          poItem.category_id,
          item.quantity_received,
          item.quantity_accepted || item.quantity_received,
          item.quantity_rejected || 0,
          poItem.unit_of_measure,
          poItem.unit_price,
          poItem.specification,
          item.notes
        ]);
      }
    }
    
    // Update receipt totals
    const totalsQuery = `
      UPDATE warehouse_receipts
      SET quantity_received = (
        SELECT COALESCE(SUM(quantity_received), 0)
        FROM warehouse_receipt_items
        WHERE receipt_id = $1
      ),
      quantity_accepted = (
        SELECT COALESCE(SUM(quantity_accepted), 0)
        FROM warehouse_receipt_items
        WHERE receipt_id = $1
      ),
      quantity_rejected = (
        SELECT COALESCE(SUM(quantity_rejected), 0)
        FROM warehouse_receipt_items
        WHERE receipt_id = $1
      )
      WHERE id = $1
      RETURNING *
    `;
    
    const totalsResult = await client.query(totalsQuery, [receipt.id]);
    
    await client.query('COMMIT');
    
    return totalsResult.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating receipt from PO:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Process receipt (quality inspection and approval)
 */
async function processReceipt(receiptId, processingData) {
  const {
    processed_by,
    processed_by_name,
    inspection_result,
    notes,
    items
  } = processingData;

  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Get receipt details
    const receiptQuery = `
      SELECT * FROM warehouse_receipts WHERE id = $1
    `;
    const receiptResult = await client.query(receiptQuery, [receiptId]);
    const receipt = receiptResult.rows[0];
    
    if (!receipt) {
      throw new Error('Receipt not found');
    }
    
    // Update receipt status
    const updateQuery = `
      UPDATE warehouse_receipts
      SET status = $1, processed_by = $2, processed_by_name = $3, 
          processed_at = CURRENT_TIMESTAMP, notes = COALESCE($4, notes)
      WHERE id = $5
      RETURNING *
    `;
    
    const updateResult = await client.query(updateQuery, [
      inspection_result || 'approved',
      processed_by,
      processed_by_name,
      notes,
      receiptId
    ]);
    
    // Update receipt items if provided
    if (items && items.length > 0) {
      for (const item of items) {
        const itemUpdateQuery = `
          UPDATE warehouse_receipt_items
          SET quantity_accepted = COALESCE($1, quantity_accepted),
              quantity_rejected = COALESCE($2, quantity_rejected),
              inspection_notes = COALESCE($3, inspection_notes)
          WHERE id = $4
        `;
        await client.query(itemUpdateQuery, [
          item.quantity_accepted,
          item.quantity_rejected,
          item.inspection_notes,
          item.id
        ]);
      }
    }
    
    // If approved, update inventory (this would integrate with inventory module)
    if (inspection_result === 'approved') {
      // Update PO received quantities
      const poUpdateQuery = `
        UPDATE purchase_order_items poi
        SET quantity_received = poi.quantity_received + wri.quantity_accepted
        FROM warehouse_receipt_items wri
        WHERE wri.receipt_id = $1 AND poi.id = wri.po_item_id
      `;
      await client.query(poUpdateQuery, [receiptId]);
      
      // Update PO status if fully received
      const poStatusQuery = `
        UPDATE purchase_orders po
        SET status = CASE 
          WHEN (SELECT SUM(quantity_pending) FROM purchase_order_items WHERE po_id = po.id) = 0 
          THEN 'received'
          ELSE 'partially_received'
        END
        WHERE po.id = (SELECT po_id FROM warehouse_receipts WHERE id = $1)
      `;
      await client.query(poStatusQuery, [receiptId]);
    }
    
    await client.query('COMMIT');
    
    return updateResult.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error processing receipt:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get receipt by ID
 */
async function getReceipt(receiptId) {
  const query = `
    SELECT 
      wr.*,
      po.po_number,
      po.supplier_id,
      s.name as supplier_name,
      ec.name as category_name,
      ec.code as category_code
    FROM warehouse_receipts wr
    LEFT JOIN purchase_orders po ON wr.po_id = po.id
    LEFT JOIN suppliers s ON po.supplier_id = s.id
    LEFT JOIN esic_categories ec ON wr.category_id = ec.id
    WHERE wr.id = $1
  `;
  
  try {
    const result = await pool.query(query, [receiptId]);
    
    if (result.rows.length === 0) {
      throw new Error('Receipt not found');
    }
    
    // Get receipt items
    const itemsQuery = `
      SELECT 
        wri.*,
        p.sku,
        ec.name as category_name,
        poi.line_number as po_line_number
      FROM warehouse_receipt_items wri
      LEFT JOIN products p ON wri.product_id = p.id
      LEFT JOIN esic_categories ec ON wri.category_id = ec.id
      LEFT JOIN purchase_order_items poi ON wri.po_item_id = poi.id
      WHERE wri.receipt_id = $1
      ORDER BY wri.line_number
    `;
    const itemsResult = await pool.query(itemsQuery, [receiptId]);
    
    return {
      receipt: result.rows[0],
      items: itemsResult.rows
    };
  } catch (error) {
    console.error('Error getting receipt:', error);
    throw error;
  }
}

/**
 * Get receipts with filtering
 */
async function getReceipts(filters) {
  const {
    tenant_id,
    po_id = null,
    status = null,
    category_id = null,
    received_by = null,
    start_date = null,
    end_date = null,
    limit = 100,
    offset = 0
  } = filters;

  let query = `
    SELECT 
      wr.*,
      po.po_number,
      s.name as supplier_name,
      ec.name as category_name
    FROM warehouse_receipts wr
    LEFT JOIN purchase_orders po ON wr.po_id = po.id
    LEFT JOIN suppliers s ON po.supplier_id = s.id
    LEFT JOIN esic_categories ec ON wr.category_id = ec.id
    WHERE wr.tenant_id = $1
  `;
  const values = [tenant_id];
  let paramCount = 1;

  if (po_id) {
    paramCount++;
    query += ` AND wr.po_id = $${paramCount}`;
    values.push(po_id);
  }

  if (status) {
    paramCount++;
    query += ` AND wr.status = $${paramCount}`;
    values.push(status);
  }

  if (category_id) {
    paramCount++;
    query += ` AND wr.category_id = $${paramCount}`;
    values.push(category_id);
  }

  if (received_by) {
    paramCount++;
    query += ` AND wr.received_by = $${paramCount}`;
    values.push(received_by);
  }

  if (start_date) {
    paramCount++;
    query += ` AND wr.received_at >= $${paramCount}`;
    values.push(start_date);
  }

  if (end_date) {
    paramCount++;
    query += ` AND wr.received_at <= $${paramCount}`;
    values.push(end_date);
  }

  query += ` ORDER BY wr.received_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
  values.push(limit, offset);

  try {
    const result = await pool.query(query, values);
    return result.rows;
  } catch (error) {
    console.error('Error getting receipts:', error);
    throw error;
  }
}

module.exports = {
  createReceiptFromPO,
  processReceipt,
  getReceipt,
  getReceipts
};
