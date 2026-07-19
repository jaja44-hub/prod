/**
 * Purchase Requisition System
 * Handles purchase requisition creation, approval, and management
 */

const { Pool } = require('pg');

// Database connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

/**
 * Generate requisition number
 */
async function generateRequisitionNumber(tenantId) {
  const query = `
    SELECT COALESCE(MAX(CAST(SUBSTRING(requisition_number FROM 12) AS INTEGER)), 0) + 1 as next_number
    FROM purchase_requisitions
    WHERE tenant_id = $1
    AND requisition_number LIKE 'PRQ-%'
  `;
  
  try {
    const result = await pool.query(query, [tenantId]);
    const nextNumber = result.rows[0].next_number;
    const year = new Date().getFullYear();
    return `PRQ-${year}-${String(nextNumber).padStart(6, '0')}`;
  } catch (error) {
    console.error('Error generating requisition number:', error);
    throw error;
  }
}

/**
 * Create purchase requisition
 */
async function createRequisition(requisitionData) {
  const {
    tenant_id,
    requested_by,
    requested_by_name,
    requested_by_role,
    department_id,
    cost_center_id,
    project_id,
    category_id,
    priority,
    urgency,
    justification,
    expected_delivery_date,
    delivery_location,
    notes,
    items
  } = requisitionData;

  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Generate requisition number
    const requisitionNumber = await generateRequisitionNumber(tenant_id);
    
    // Insert requisition header
    const requisitionQuery = `
      INSERT INTO purchase_requisitions 
      (tenant_id, requisition_number, requested_by, requested_by_name, requested_by_role,
       department_id, cost_center_id, project_id, category_id, priority, urgency,
       justification, expected_delivery_date, delivery_location, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `;
    
    const requisitionValues = [
      tenant_id,
      requisitionNumber,
      requested_by,
      requested_by_name,
      requested_by_role,
      department_id,
      cost_center_id,
      project_id,
      category_id,
      priority || 'normal',
      urgency || 'normal',
      justification,
      expected_delivery_date,
      delivery_location,
      notes
    ];
    
    const requisitionResult = await client.query(requisitionQuery, requisitionValues);
    const requisition = requisitionResult.rows[0];
    
    // Insert requisition items
    if (items && items.length > 0) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const itemQuery = `
          INSERT INTO purchase_requisition_items 
          (requisition_id, line_number, product_id, product_name, product_description,
           category_id, quantity, unit_of_measure, unit_price, estimated_delivery_date,
           specification, preferred_supplier_id, notes)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          RETURNING *
        `;
        
        const itemValues = [
          requisition.id,
          i + 1,
          item.product_id,
          item.product_name,
          item.product_description,
          item.category_id,
          item.quantity,
          item.unit_of_measure,
          item.unit_price || 0,
          item.estimated_delivery_date,
          item.specification,
          item.preferred_supplier_id,
          item.notes
        ];
        
        await client.query(itemQuery, itemValues);
      }
    }
    
    // Update total amount
    const totalQuery = `
      UPDATE purchase_requisitions
      SET total_amount = (
        SELECT COALESCE(SUM(total_price), 0)
        FROM purchase_requisition_items
        WHERE requisition_id = $1
      )
      WHERE id = $1
      RETURNING *
    `;
    
    const totalResult = await client.query(totalQuery, [requisition.id]);
    
    await client.query('COMMIT');
    
    return totalResult.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating requisition:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Validate budget for requisition
 */
async function validateBudget(requisitionId, budgetId) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Get requisition total
    const requisitionQuery = `
      SELECT total_amount, tenant_id, category_id
      FROM purchase_requisitions
      WHERE id = $1
    `;
    const requisitionResult = await client.query(requisitionQuery, [requisitionId]);
    const requisition = requisitionResult.rows[0];
    
    if (!requisition) {
      throw new Error('Requisition not found');
    }
    
    // Get budget information
    const budgetQuery = `
      SELECT budgeted_amount, committed_amount, actual_amount, available_amount, status
      FROM budgets
      WHERE id = $1 AND tenant_id = $2
    `;
    const budgetResult = await client.query(budgetQuery, [budgetId, requisition.tenant_id]);
    const budget = budgetResult.rows[0];
    
    if (!budget) {
      throw new Error('Budget not found');
    }
    
    if (budget.status !== 'active') {
      return {
        valid: false,
        message: `Budget is not active (status: ${budget.status})`
      };
    }
    
    if (budget.available_amount < requisition.total_amount) {
      return {
        valid: false,
        message: `Insufficient budget. Available: ${budget.available_amount}, Required: ${requisition.total_amount}`
      };
    }
    
    // Update requisition with budget validation
    const updateQuery = `
      UPDATE purchase_requisitions
      SET budget_id = $1, budget_validated = true, budget_validation_message = 'Budget validated successfully'
      WHERE id = $2
    `;
    await client.query(updateQuery, [budgetId, requisitionId]);
    
    await client.query('COMMIT');
    
    return {
      valid: true,
      message: 'Budget validated successfully',
      available_amount: budget.available_amount,
      required_amount: requisition.total_amount
    };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error validating budget:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Submit requisition for approval
 */
async function submitRequisition(requisitionId, submitterData) {
  const { submitter_id, submitter_name } = submitterData;
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Get requisition details
    const requisitionQuery = `
      SELECT * FROM purchase_requisitions WHERE id = $1
    `;
    const requisitionResult = await client.query(requisitionQuery, [requisitionId]);
    const requisition = requisitionResult.rows[0];
    
    if (!requisition) {
      throw new Error('Requisition not found');
    }
    
    if (requisition.status !== 'draft') {
      throw new Error(`Requisition is not in draft status (current: ${requisition.status})`);
    }
    
    // Start approval workflow
    const workflow = require('../approval/workflow');
    const workflowInstance = await workflow.startWorkflowInstance(requisition.tenant_id, {
      workflow_type: 'purchase_requisition',
      reference_type: 'purchase_requisition',
      reference_id: requisitionId.toString(),
      initiator_id: submitter_id,
      initiator_name: submitter_name,
      amount: requisition.total_amount,
      currency: requisition.currency,
      description: `Purchase Requisition ${requisition.requisition_number}`
    });
    
    // Update requisition status
    const updateQuery = `
      UPDATE purchase_requisitions
      SET status = 'pending', workflow_instance_id = $1
      WHERE id = $2
      RETURNING *
    `;
    const updateResult = await client.query(updateQuery, [workflowInstance.id, requisitionId]);
    
    await client.query('COMMIT');
    
    return updateResult.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error submitting requisition:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Approve requisition
 */
async function approveRequisition(requisitionId, approverData) {
  const { approver_id, approver_name, comments } = approverData;
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Get requisition details
    const requisitionQuery = `
      SELECT * FROM purchase_requisitions WHERE id = $1 FOR UPDATE
    `;
    const requisitionResult = await client.query(requisitionQuery, [requisitionId]);
    const requisition = requisitionResult.rows[0];
    
    if (!requisition) {
      throw new Error('Requisition not found');
    }
    
    if (requisition.status !== 'pending') {
      throw new Error(`Requisition is not pending approval (current: ${requisition.status})`);
    }
    
    // Approve workflow stage
    const workflow = require('../approval/workflow');
    const workflowResult = await workflow.approveWorkflowStage(requisition.workflow_instance_id, {
      actor_id: approver_id,
      actor_name: approver_name,
      comments: comments
    });
    
    // Check if workflow is complete
    if (workflowResult.status === 'approved') {
      // Update requisition status
      const updateQuery = `
        UPDATE purchase_requisitions
        SET status = 'approved', approved_by = $1, approved_by_name = $2, approved_at = CURRENT_TIMESTAMP
        WHERE id = $3
        RETURNING *
      `;
      const updateResult = await client.query(updateQuery, [approver_id, approver_name, requisitionId]);
      
      await client.query('COMMIT');
      return updateResult.rows[0];
    } else {
      await client.query('COMMIT');
      return requisition;
    }
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error approving requisition:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Reject requisition
 */
async function rejectRequisition(requisitionId, rejectorData) {
  const { rejector_id, rejector_name, rejection_reason } = rejectorData;
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Get requisition details
    const requisitionQuery = `
      SELECT * FROM purchase_requisitions WHERE id = $1 FOR UPDATE
    `;
    const requisitionResult = await client.query(requisitionQuery, [requisitionId]);
    const requisition = requisitionResult.rows[0];
    
    if (!requisition) {
      throw new Error('Requisition not found');
    }
    
    if (requisition.status !== 'pending') {
      throw new Error(`Requisition is not pending approval (current: ${requisition.status})`);
    }
    
    // Reject workflow
    const workflow = require('../approval/workflow');
    await workflow.rejectWorkflow(requisition.workflow_instance_id, {
      actor_id: rejector_id,
      actor_name: rejector_name,
      comments: rejection_reason
    });
    
    // Update requisition status
    const updateQuery = `
      UPDATE purchase_requisitions
      SET status = 'rejected', rejected_by = $1, rejected_by_name = $2, 
          rejected_at = CURRENT_TIMESTAMP, rejection_reason = $3
      WHERE id = $4
      RETURNING *
    `;
    const updateResult = await client.query(updateQuery, [rejector_id, rejector_name, rejection_reason, requisitionId]);
    
    await client.query('COMMIT');
    
    return updateResult.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error rejecting requisition:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get requisition by ID
 */
async function getRequisition(requisitionId) {
  const query = `
    SELECT 
      pr.*,
      ec.name as category_name,
      ec.code as category_code,
      b.budget_code,
      b.name as budget_name,
      wi.status as workflow_status,
      wi.current_stage as workflow_stage
    FROM purchase_requisitions pr
    LEFT JOIN esic_categories ec ON pr.category_id = ec.id
    LEFT JOIN budgets b ON pr.budget_id = b.id
    LEFT JOIN approval_workflow_instances wi ON pr.workflow_instance_id = wi.id
    WHERE pr.id = $1
  `;
  
  try {
    const result = await pool.query(query, [requisitionId]);
    
    if (result.rows.length === 0) {
      throw new Error('Requisition not found');
    }
    
    // Get requisition items
    const itemsQuery = `
      SELECT 
        pri.*,
        p.sku,
        ec.name as category_name,
        s.name as preferred_supplier_name
      FROM purchase_requisition_items pri
      LEFT JOIN products p ON pri.product_id = p.id
      LEFT JOIN esic_categories ec ON pri.category_id = ec.id
      LEFT JOIN suppliers s ON pri.preferred_supplier_id = s.id
      WHERE pri.requisition_id = $1
      ORDER BY pri.line_number
    `;
    const itemsResult = await pool.query(itemsQuery, [requisitionId]);
    
    return {
      requisition: result.rows[0],
      items: itemsResult.rows
    };
  } catch (error) {
    console.error('Error getting requisition:', error);
    throw error;
  }
}

/**
 * Get requisitions with filtering
 */
async function getRequisitions(filters) {
  const {
    tenant_id,
    status = null,
    requested_by = null,
    category_id = null,
    budget_id = null,
    start_date = null,
    end_date = null,
    limit = 100,
    offset = 0
  } = filters;

  let query = `
    SELECT 
      pr.*,
      ec.name as category_name,
      ec.code as category_code,
      b.budget_code,
      wi.status as workflow_status
    FROM purchase_requisitions pr
    LEFT JOIN esic_categories ec ON pr.category_id = ec.id
    LEFT JOIN budgets b ON pr.budget_id = b.id
    LEFT JOIN approval_workflow_instances wi ON pr.workflow_instance_id = wi.id
    WHERE pr.tenant_id = $1
  `;
  const values = [tenant_id];
  let paramCount = 1;

  if (status) {
    paramCount++;
    query += ` AND pr.status = $${paramCount}`;
    values.push(status);
  }

  if (requested_by) {
    paramCount++;
    query += ` AND pr.requested_by = $${paramCount}`;
    values.push(requested_by);
  }

  if (category_id) {
    paramCount++;
    query += ` AND pr.category_id = $${paramCount}`;
    values.push(category_id);
  }

  if (budget_id) {
    paramCount++;
    query += ` AND pr.budget_id = $${paramCount}`;
    values.push(budget_id);
  }

  if (start_date) {
    paramCount++;
    query += ` AND pr.requisition_date >= $${paramCount}`;
    values.push(start_date);
  }

  if (end_date) {
    paramCount++;
    query += ` AND pr.requisition_date <= $${paramCount}`;
    values.push(end_date);
  }

  query += ` ORDER BY pr.requisition_date DESC, pr.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
  values.push(limit, offset);

  try {
    const result = await pool.query(query, values);
    return result.rows;
  } catch (error) {
    console.error('Error getting requisitions:', error);
    throw error;
  }
}

/**
 * Update requisition
 */
async function updateRequisition(requisitionId, updateData) {
  const {
    priority,
    urgency,
    justification,
    expected_delivery_date,
    delivery_location,
    notes,
    items
  } = updateData;

  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Update requisition header
    const updateQuery = `
      UPDATE purchase_requisitions
      SET priority = COALESCE($1, priority),
          urgency = COALESCE($2, urgency),
          justification = COALESCE($3, justification),
          expected_delivery_date = COALESCE($4, expected_delivery_date),
          delivery_location = COALESCE($5, delivery_location),
          notes = COALESCE($6, notes)
      WHERE id = $7 AND status = 'draft'
      RETURNING *
    `;
    
    const updateValues = [
      priority,
      urgency,
      justification,
      expected_delivery_date,
      delivery_location,
      notes,
      requisitionId
    ];
    
    const updateResult = await client.query(updateQuery, updateValues);
    
    if (updateResult.rows.length === 0) {
      throw new Error('Requisition not found or not in draft status');
    }
    
    // Update items if provided
    if (items && items.length > 0) {
      // Delete existing items
      for (const item of items) {
        if (item.id) {
          await client.query('DELETE FROM purchase_requisition_items WHERE id = $1', [item.id]);
        }
      }
      
      // Insert/update items
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        
        if (item.id) {
          // Update existing item
          const itemUpdateQuery = `
            UPDATE purchase_requisition_items
            SET product_id = COALESCE($1, product_id),
                product_name = COALESCE($2, product_name),
                product_description = COALESCE($3, product_description),
                category_id = COALESCE($4, category_id),
                quantity = COALESCE($5, quantity),
                unit_of_measure = COALESCE($6, unit_of_measure),
                unit_price = COALESCE($7, unit_price),
                estimated_delivery_date = COALESCE($8, estimated_delivery_date),
                specification = COALESCE($9, specification),
                preferred_supplier_id = COALESCE($10, preferred_supplier_id),
                notes = COALESCE($11, notes)
            WHERE id = $12
          `;
          await client.query(itemUpdateQuery, [
            item.product_id,
            item.product_name,
            item.product_description,
            item.category_id,
            item.quantity,
            item.unit_of_measure,
            item.unit_price,
            item.estimated_delivery_date,
            item.specification,
            item.preferred_supplier_id,
            item.notes,
            item.id
          ]);
        } else {
          // Insert new item
          const itemInsertQuery = `
            INSERT INTO purchase_requisition_items 
            (requisition_id, line_number, product_id, product_name, product_description,
             category_id, quantity, unit_of_measure, unit_price, estimated_delivery_date,
             specification, preferred_supplier_id, notes)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          `;
          await client.query(itemInsertQuery, [
            requisitionId,
            i + 1,
            item.product_id,
            item.product_name,
            item.product_description,
            item.category_id,
            item.quantity,
            item.unit_of_measure,
            item.unit_price,
            item.estimated_delivery_date,
            item.specification,
            item.preferred_supplier_id,
            item.notes
          ]);
        }
      }
    }
    
    // Recalculate total
    const totalQuery = `
      UPDATE purchase_requisitions
      SET total_amount = (
        SELECT COALESCE(SUM(total_price), 0)
        FROM purchase_requisition_items
        WHERE requisition_id = $1
      )
      WHERE id = $1
      RETURNING *
    `;
    
    const totalResult = await client.query(totalQuery, [requisitionId]);
    
    await client.query('COMMIT');
    
    return totalResult.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating requisition:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Delete requisition
 */
async function deleteRequisition(requisitionId) {
  const query = `
    DELETE FROM purchase_requisitions
    WHERE id = $1 AND status = 'draft'
    RETURNING *
  `;
  
  try {
    const result = await pool.query(query, [requisitionId]);
    
    if (result.rows.length === 0) {
      throw new Error('Requisition not found or not in draft status');
    }
    
    return result.rows[0];
  } catch (error) {
    console.error('Error deleting requisition:', error);
    throw error;
  }
}

module.exports = {
  createRequisition,
  validateBudget,
  submitRequisition,
  approveRequisition,
  rejectRequisition,
  getRequisition,
  getRequisitions,
  updateRequisition,
  deleteRequisition
};
