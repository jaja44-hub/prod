/**
 * Budget Validation Integration
 * Handles budget validation and commitment management for purchase operations
 */

const { Pool } = require('pg');

// Database connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

/**
 * Check budget availability
 */
async function checkBudgetAvailability(budgetId, requiredAmount) {
  const query = `
    SELECT 
      id,
      budget_code,
      name,
      budgeted_amount,
      allocated_amount,
      committed_amount,
      actual_amount,
      available_amount,
      status,
      fiscal_year,
      fiscal_period
    FROM budgets
    WHERE id = $1 AND status = 'active'
  `;
  
  try {
    const result = await pool.query(query, [budgetId]);
    
    if (result.rows.length === 0) {
      return {
        valid: false,
        message: 'Budget not found or not active'
      };
    }
    
    const budget = result.rows[0];
    
    if (budget.available_amount < requiredAmount) {
      return {
        valid: false,
        message: `Insufficient budget. Available: ${budget.available_amount}, Required: ${requiredAmount}`,
        budget: budget,
        shortfall: requiredAmount - budget.available_amount
      };
    }
    
    return {
      valid: true,
      message: 'Budget available',
      budget: budget,
      available_after: budget.available_amount - requiredAmount
    };
  } catch (error) {
    console.error('Error checking budget availability:', error);
    throw error;
  }
}

/**
 * Create budget commitment
 */
async function createBudgetCommitment(commitmentData) {
  const {
    tenant_id,
    budget_id,
    commitment_type,
    reference_type,
    reference_id,
    committed_amount,
    currency,
    committed_by,
    committed_by_name,
    notes
  } = commitmentData;

  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Check budget availability
    const budgetCheck = await checkBudgetAvailability(budget_id, committed_amount);
    
    if (!budgetCheck.valid) {
      throw new Error(budgetCheck.message);
    }
    
    // Create commitment
    const commitmentQuery = `
      INSERT INTO budget_commitments 
      (tenant_id, budget_id, commitment_type, reference_type, reference_id, 
       committed_amount, currency, status, committed_by, committed_by_name, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', $8, $9, $10)
      RETURNING *
    `;
    
    const commitmentValues = [
      tenant_id,
      budget_id,
      commitment_type,
      reference_type,
      reference_id,
      committed_amount,
      currency || 'ETB',
      committed_by,
      committed_by_name,
      notes
    ];
    
    const commitmentResult = await client.query(commitmentQuery, commitmentValues);
    const commitment = commitmentResult.rows[0];
    
    // Update budget committed amount
    const updateBudgetQuery = `
      UPDATE budgets
      SET committed_amount = committed_amount + $1
      WHERE id = $2
      RETURNING *
    `;
    await client.query(updateBudgetQuery, [committed_amount, budget_id]);
    
    await client.query('COMMIT');
    
    return commitment;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating budget commitment:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Release budget commitment
 */
async function releaseBudgetCommitment(commitmentId, releaseData) {
  const {
    released_by,
    released_by_name,
    notes
  } = releaseData;

  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Get commitment details
    const commitmentQuery = `
      SELECT * FROM budget_commitments WHERE id = $1 AND status = 'active'
    `;
    const commitmentResult = await client.query(commitmentQuery, [commitmentId]);
    const commitment = commitmentResult.rows[0];
    
    if (!commitment) {
      throw new Error('Commitment not found or already released');
    }
    
    // Update commitment status
    const updateCommitmentQuery = `
      UPDATE budget_commitments
      SET status = 'released', released_by = $1, released_by_name = $2, released_at = CURRENT_TIMESTAMP, notes = $3
      WHERE id = $4
      RETURNING *
    `;
    await client.query(updateCommitmentQuery, [released_by, released_by_name, notes, commitmentId]);
    
    // Update budget committed amount
    const updateBudgetQuery = `
      UPDATE budgets
      SET committed_amount = committed_amount - $1
      WHERE id = $2
      RETURNING *
    `;
    await client.query(updateBudgetQuery, [commitment.committed_amount, commitment.budget_id]);
    
    await client.query('COMMIT');
    
    return commitment;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error releasing budget commitment:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get budget commitments
 */
async function getBudgetCommitments(filters) {
  const {
    tenant_id,
    budget_id = null,
    commitment_type = null,
    reference_type = null,
    reference_id = null,
    status = null,
    start_date = null,
    end_date = null,
    limit = 100,
    offset = 0
  } = filters;

  let query = `
    SELECT 
      bc.*,
      b.budget_code,
      b.name as budget_name,
      b.fiscal_year,
      b.fiscal_period
    FROM budget_commitments bc
    LEFT JOIN budgets b ON bc.budget_id = b.id
    WHERE bc.tenant_id = $1
  `;
  const values = [tenant_id];
  let paramCount = 1;

  if (budget_id) {
    paramCount++;
    query += ` AND bc.budget_id = $${paramCount}`;
    values.push(budget_id);
  }

  if (commitment_type) {
    paramCount++;
    query += ` AND bc.commitment_type = $${paramCount}`;
    values.push(commitment_type);
  }

  if (reference_type) {
    paramCount++;
    query += ` AND bc.reference_type = $${paramCount}`;
    values.push(reference_type);
  }

  if (reference_id) {
    paramCount++;
    query += ` AND bc.reference_id = $${paramCount}`;
    values.push(reference_id);
  }

  if (status) {
    paramCount++;
    query += ` AND bc.status = $${paramCount}`;
    values.push(status);
  }

  if (start_date) {
    paramCount++;
    query += ` AND bc.committed_at >= $${paramCount}`;
    values.push(start_date);
  }

  if (end_date) {
    paramCount++;
    query += ` AND bc.committed_at <= $${paramCount}`;
    values.push(end_date);
  }

  query += ` ORDER BY bc.committed_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
  values.push(limit, offset);

  try {
    const result = await pool.query(query, values);
    return result.rows;
  } catch (error) {
    console.error('Error getting budget commitments:', error);
    throw error;
  }
}

/**
 * Get budget by category
 */
async function getBudgetByCategory(tenantId, categoryId, fiscalYear, fiscalPeriod) {
  const query = `
    SELECT 
      id,
      budget_code,
      name,
      category_id,
      fiscal_year,
      fiscal_period,
      budgeted_amount,
      allocated_amount,
      committed_amount,
      actual_amount,
      available_amount,
      status
    FROM budgets
    WHERE tenant_id = $1 
      AND category_id = $2 
      AND fiscal_year = $3 
      AND fiscal_period = $4
      AND status = 'active'
  `;
  
  try {
    const result = await pool.query(query, [tenantId, categoryId, fiscalYear, fiscalPeriod]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0];
  } catch (error) {
    console.error('Error getting budget by category:', error);
    throw error;
  }
}

/**
 * Validate purchase requisition budget
 */
async function validateRequisitionBudget(requisitionId) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Get requisition details
    const requisitionQuery = `
      SELECT 
        pr.*,
        ec.name as category_name
      FROM purchase_requisitions pr
      LEFT JOIN esic_categories ec ON pr.category_id = ec.id
      WHERE pr.id = $1
    `;
    const requisitionResult = await client.query(requisitionQuery, [requisitionId]);
    const requisition = requisitionResult.rows[0];
    
    if (!requisition) {
      throw new Error('Requisition not found');
    }
    
    // Get current fiscal period
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const fiscalPeriod = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
    
    // Find appropriate budget
    let budget = null;
    
    if (requisition.budget_id) {
      // Use specified budget
      const budgetQuery = `SELECT * FROM budgets WHERE id = $1 AND status = 'active'`;
      const budgetResult = await client.query(budgetQuery, [requisition.budget_id]);
      budget = budgetResult.rows[0];
    } else if (requisition.category_id) {
      // Find budget by category
      budget = await getBudgetByCategory(requisition.tenant_id, requisition.category_id, currentYear, fiscalPeriod);
    }
    
    if (!budget) {
      return {
        valid: false,
        message: 'No active budget found for this requisition',
        requisition: requisition
      };
    }
    
    // Check budget availability
    const budgetCheck = await checkBudgetAvailability(budget.id, requisition.total_amount);
    
    if (!budgetCheck.valid) {
      // Update requisition with budget validation failure
      const updateQuery = `
        UPDATE purchase_requisitions
        SET budget_id = $1, budget_validated = false, budget_validation_message = $2
        WHERE id = $3
      `;
      await client.query(updateQuery, [budget.id, budgetCheck.message, requisitionId]);
      
      await client.query('COMMIT');
      
      return {
        valid: false,
        message: budgetCheck.message,
        budget: budget,
        requisition: requisition,
        shortfall: budgetCheck.shortfall
      };
    }
    
    // Update requisition with budget validation success
    const updateQuery = `
      UPDATE purchase_requisitions
      SET budget_id = $1, budget_validated = true, budget_validation_message = 'Budget validated successfully'
      WHERE id = $2
    `;
    await client.query(updateQuery, [budget.id, requisitionId]);
    
    await client.query('COMMIT');
    
    return {
      valid: true,
      message: 'Budget validated successfully',
      budget: budget,
      requisition: requisition,
      available_after: budgetCheck.available_after
    };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error validating requisition budget:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Validate purchase order budget
 */
async function validatePOBudget(poId) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Get PO details
    const poQuery = `
      SELECT 
        po.*,
        ec.name as category_name
      FROM purchase_orders po
      LEFT JOIN esic_categories ec ON po.category_id = ec.id
      WHERE po.id = $1
    `;
    const poResult = await client.query(poQuery, [poId]);
    const po = poResult.rows[0];
    
    if (!po) {
      throw new Error('Purchase order not found');
    }
    
    // Get current fiscal period
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const fiscalPeriod = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
    
    // Find appropriate budget
    let budget = null;
    
    if (po.requisition_id) {
      // Use requisition budget
      const requisitionQuery = `
        SELECT budget_id FROM purchase_requisitions WHERE id = $1
      `;
      const requisitionResult = await client.query(requisitionQuery, [po.requisition_id]);
      const requisitionBudgetId = requisitionResult.rows[0]?.budget_id;
      
      if (requisitionBudgetId) {
        const budgetQuery = `SELECT * FROM budgets WHERE id = $1 AND status = 'active'`;
        const budgetResult = await client.query(budgetQuery, [requisitionBudgetId]);
        budget = budgetResult.rows[0];
      }
    }
    
    if (!budget && po.category_id) {
      // Find budget by category
      budget = await getBudgetByCategory(po.tenant_id, po.category_id, currentYear, fiscalPeriod);
    }
    
    if (!budget) {
      return {
        valid: false,
        message: 'No active budget found for this purchase order',
        po: po
      };
    }
    
    // Check budget availability
    const budgetCheck = await checkBudgetAvailability(budget.id, po.total_amount);
    
    if (!budgetCheck.valid) {
      await client.query('COMMIT');
      
      return {
        valid: false,
        message: budgetCheck.message,
        budget: budget,
        po: po,
        shortfall: budgetCheck.shortfall
      };
    }
    
    await client.query('COMMIT');
    
    return {
      valid: true,
      message: 'Budget available',
      budget: budget,
      po: po,
      available_after: budgetCheck.available_after
    };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error validating PO budget:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get budget utilization report
 */
async function getBudgetUtilizationReport(tenantId, fiscalYear, fiscalPeriod) {
  const query = `
    SELECT 
      b.id,
      b.budget_code,
      b.name,
      b.category_id,
      ec.name as category_name,
      ec.code as category_code,
      b.fiscal_year,
      b.fiscal_period,
      b.budgeted_amount,
      b.allocated_amount,
      b.committed_amount,
      b.actual_amount,
      b.available_amount,
      ROUND((b.committed_amount / NULLIF(b.budgeted_amount, 0)) * 100, 2) as commitment_percentage,
      ROUND((b.actual_amount / NULLIF(b.budgeted_amount, 0)) * 100, 2) as utilization_percentage,
      ROUND((b.available_amount / NULLIF(b.budgeted_amount, 0)) * 100, 2) as availability_percentage,
      COUNT(bc.id) as active_commitments,
      COALESCE(SUM(bc.committed_amount), 0) as total_commitments
    FROM budgets b
    LEFT JOIN esic_categories ec ON b.category_id = ec.id
    LEFT JOIN budget_commitments bc ON b.id = bc.budget_id AND bc.status = 'active'
    WHERE b.tenant_id = $1 
      AND b.fiscal_year = $2 
      AND b.fiscal_period = $3
    GROUP BY b.id, b.budget_code, b.name, b.category_id, ec.name, ec.code, 
             b.fiscal_year, b.fiscal_period, b.budgeted_amount, b.allocated_amount,
             b.committed_amount, b.actual_amount, b.available_amount
    ORDER BY b.budget_code ASC
  `;
  
  try {
    const result = await pool.query(query, [tenantId, fiscalYear, fiscalPeriod]);
    return result.rows;
  } catch (error) {
    console.error('Error getting budget utilization report:', error);
    throw error;
  }
}

module.exports = {
  checkBudgetAvailability,
  createBudgetCommitment,
  releaseBudgetCommitment,
  getBudgetCommitments,
  getBudgetByCategory,
  validateRequisitionBudget,
  validatePOBudget,
  getBudgetUtilizationReport
};
