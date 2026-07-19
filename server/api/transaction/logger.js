/**
 * Transaction Logging Infrastructure
 * Provides comprehensive logging of all system transactions for audit and compliance
 */

const { Pool } = require('pg');

// Database connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

/**
 * Log a transaction to the transaction log
 */
async function logTransaction(transactionData) {
  const {
    tenant_id,
    transaction_type,
    reference_type,
    reference_id,
    amount = null,
    currency = 'ETB',
    description = null,
    user_id,
    user_name,
    user_role = null,
    ip_address = null,
    user_agent = null,
    status = 'completed',
    error_message = null,
    metadata = null
  } = transactionData;

  const query = `
    INSERT INTO transaction_log 
    (tenant_id, transaction_type, transaction_date, reference_type, reference_id, 
     amount, currency, description, user_id, user_name, user_role, ip_address, 
     user_agent, status, error_message, metadata)
    VALUES ($1, $2, CURRENT_TIMESTAMP, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    RETURNING *
  `;

  const values = [
    tenant_id,
    transaction_type,
    reference_type,
    reference_id,
    amount,
    currency,
    description,
    user_id,
    user_name,
    user_role,
    ip_address,
    user_agent,
    status,
    error_message,
    metadata ? JSON.stringify(metadata) : null
  ];

  try {
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error('Error logging transaction:', error);
    throw error;
  }
}

/**
 * Log an audit trail entry
 */
async function logAuditTrail(auditData) {
  const {
    tenant_id,
    table_name,
    record_id,
    action_type,
    old_values = null,
    new_values = null,
    changed_fields = null,
    changed_by,
    changed_by_name,
    ip_address = null,
    user_agent = null,
    reason = null
  } = auditData;

  const query = `
    INSERT INTO audit_trail 
    (tenant_id, table_name, record_id, action_type, old_values, new_values, 
     changed_fields, changed_by, changed_by_name, ip_address, user_agent, reason)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING *
  `;

  const values = [
    tenant_id,
    table_name,
    record_id,
    action_type,
    old_values ? JSON.stringify(old_values) : null,
    new_values ? JSON.stringify(new_values) : null,
    changed_fields ? JSON.stringify(changed_fields) : null,
    changed_by,
    changed_by_name,
    ip_address,
    user_agent,
    reason
  ];

  try {
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error('Error logging audit trail:', error);
    throw error;
  }
}

/**
 * Get transaction log entries with filtering
 */
async function getTransactionLog(filters) {
  const {
    tenant_id,
    transaction_type = null,
    reference_type = null,
    reference_id = null,
    user_id = null,
    start_date = null,
    end_date = null,
    status = null,
    limit = 100,
    offset = 0
  } = filters;

  let query = `
    SELECT * FROM transaction_log 
    WHERE tenant_id = $1
  `;
  const values = [tenant_id];
  let paramCount = 1;

  if (transaction_type) {
    paramCount++;
    query += ` AND transaction_type = $${paramCount}`;
    values.push(transaction_type);
  }

  if (reference_type) {
    paramCount++;
    query += ` AND reference_type = $${paramCount}`;
    values.push(reference_type);
  }

  if (reference_id) {
    paramCount++;
    query += ` AND reference_id = $${paramCount}`;
    values.push(reference_id);
  }

  if (user_id) {
    paramCount++;
    query += ` AND user_id = $${paramCount}`;
    values.push(user_id);
  }

  if (start_date) {
    paramCount++;
    query += ` AND transaction_date >= $${paramCount}`;
    values.push(start_date);
  }

  if (end_date) {
    paramCount++;
    query += ` AND transaction_date <= $${paramCount}`;
    values.push(end_date);
  }

  if (status) {
    paramCount++;
    query += ` AND status = $${paramCount}`;
    values.push(status);
  }

  query += ` ORDER BY transaction_date DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
  values.push(limit, offset);

  try {
    const result = await pool.query(query, values);
    return result.rows;
  } catch (error) {
    console.error('Error getting transaction log:', error);
    throw error;
  }
}

/**
 * Get audit trail entries with filtering
 */
async function getAuditTrail(filters) {
  const {
    tenant_id,
    table_name = null,
    record_id = null,
    action_type = null,
    changed_by = null,
    start_date = null,
    end_date = null,
    limit = 100,
    offset = 0
  } = filters;

  let query = `
    SELECT * FROM audit_trail 
    WHERE tenant_id = $1
  `;
  const values = [tenant_id];
  let paramCount = 1;

  if (table_name) {
    paramCount++;
    query += ` AND table_name = $${paramCount}`;
    values.push(table_name);
  }

  if (record_id) {
    paramCount++;
    query += ` AND record_id = $${paramCount}`;
    values.push(record_id);
  }

  if (action_type) {
    paramCount++;
    query += ` AND action_type = $${paramCount}`;
    values.push(action_type);
  }

  if (changed_by) {
    paramCount++;
    query += ` AND changed_by = $${paramCount}`;
    values.push(changed_by);
  }

  if (start_date) {
    paramCount++;
    query += ` AND changed_at >= $${paramCount}`;
    values.push(start_date);
  }

  if (end_date) {
    paramCount++;
    query += ` AND changed_at <= $${paramCount}`;
    values.push(end_date);
  }

  query += ` ORDER BY changed_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
  values.push(limit, offset);

  try {
    const result = await pool.query(query, values);
    return result.rows;
  } catch (error) {
    console.error('Error getting audit trail:', error);
    throw error;
  }
}

/**
 * Get transaction statistics for a tenant
 */
async function getTransactionStatistics(tenantId, startDate, endDate) {
  const query = `
    SELECT 
      transaction_type,
      COUNT(*) as total_transactions,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
      COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
      COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
      COALESCE(SUM(amount), 0) as total_amount,
      COUNT(DISTINCT user_id) as unique_users
    FROM transaction_log 
    WHERE tenant_id = $1 
      AND transaction_date >= $2 
      AND transaction_date <= $3
    GROUP BY transaction_type
    ORDER BY total_transactions DESC
  `;

  try {
    const result = await pool.query(query, [tenantId, startDate, endDate]);
    return result.rows;
  } catch (error) {
    console.error('Error getting transaction statistics:', error);
    throw error;
  }
}

/**
 * Get audit trail statistics for a tenant
 */
async function getAuditStatistics(tenantId, startDate, endDate) {
  const query = `
    SELECT 
      table_name,
      action_type,
      COUNT(*) as total_actions,
      COUNT(DISTINCT changed_by) as unique_users,
      COUNT(CASE WHEN action_type = 'insert' THEN 1 END) as inserts,
      COUNT(CASE WHEN action_type = 'update' THEN 1 END) as updates,
      COUNT(CASE WHEN action_type = 'delete' THEN 1 END) as deletes
    FROM audit_trail 
    WHERE tenant_id = $1 
      AND changed_at >= $2 
      AND changed_at <= $3
    GROUP BY table_name, action_type
    ORDER BY total_actions DESC
  `;

  try {
    const result = await pool.query(query, [tenantId, startDate, endDate]);
    return result.rows;
  } catch (error) {
    console.error('Error getting audit statistics:', error);
    throw error;
  }
}

/**
 * Middleware for automatic transaction logging
 */
function transactionLogger(transactionType) {
  return async (req, res, next) => {
    const originalSend = res.send;
    let transactionData = null;

    // Capture response data
    res.send = function(data) {
      transactionData = data;
      originalSend.call(this, data);
    };

    // Log after response is sent
    res.on('finish', async () => {
      if (req.tenant && req.user && transactionData) {
        try {
          await logTransaction({
            tenant_id: req.tenant.id,
            transaction_type: transactionType,
            reference_type: req.path.split('/')[1] || 'api',
            reference_id: req.params.id || req.body.id || null,
            amount: req.body.amount || null,
            currency: req.body.currency || 'ETB',
            description: req.body.description || `${transactionType} operation`,
            user_id: req.user.id,
            user_name: req.user.name || req.user.email,
            user_role: req.user.role || null,
            ip_address: req.ip || null,
            user_agent: req.get('user-agent') || null,
            status: res.statusCode >= 200 && res.statusCode < 300 ? 'completed' : 'failed',
            error_message: res.statusCode >= 400 ? res.statusMessage : null,
            metadata: {
              method: req.method,
              path: req.path,
              status_code: res.statusCode
            }
          });
        } catch (error) {
          console.error('Error in transaction logger middleware:', error);
        }
      }
    });

    next();
  };
}

/**
 * Middleware for automatic audit trail logging
 */
function auditLogger(tableName) {
  return async (req, res, next) => {
    const originalSend = res.send;
    let responseData = null;
    let requestData = JSON.parse(JSON.stringify(req.body));

    // Capture response data
    res.send = function(data) {
      responseData = data;
      originalSend.call(this, data);
    };

    // Log after response is sent
    res.on('finish', async () => {
      if (req.tenant && req.user && (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE')) {
        try {
          const actionType = req.method === 'POST' ? 'insert' : 
                           req.method === 'PUT' ? 'update' : 'delete';
          
          const recordId = req.params.id || responseData?.id || requestData?.id;
          
          if (recordId) {
            await logAuditTrail({
              tenant_id: req.tenant.id,
              table_name: tableName,
              record_id: recordId,
              action_type: actionType,
              old_values: actionType === 'update' ? requestData : null,
              new_values: actionType !== 'delete' ? responseData : null,
              changed_fields: actionType === 'update' ? Object.keys(requestData) : null,
              changed_by: req.user.id,
              changed_by_name: req.user.name || req.user.email,
              ip_address: req.ip || null,
              user_agent: req.get('user-agent') || null,
              reason: req.body.reason || null
            });
          }
        } catch (error) {
          console.error('Error in audit logger middleware:', error);
        }
      }
    });

    next();
  };
}

module.exports = {
  logTransaction,
  logAuditTrail,
  getTransactionLog,
  getAuditTrail,
  getTransactionStatistics,
  getAuditStatistics,
  transactionLogger,
  auditLogger
};
