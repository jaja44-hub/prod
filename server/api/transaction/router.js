/**
 * Transaction Logging API Router
 * Express router for transaction logging endpoints
 */

const express = require('express');
const router = express.Router();
const {
  logTransaction,
  logAuditTrail,
  getTransactionLog,
  getAuditTrail,
  getTransactionStatistics,
  getAuditStatistics
} = require('./logger');

/**
 * POST /api/transactions/log
 * Log a transaction
 */
router.post('/log', async (req, res) => {
  try {
    const transactionData = req.body;
    
    if (!transactionData.tenant_id || !transactionData.transaction_type) {
      return res.status(400).json({
        success: false,
        error: 'tenant_id and transaction_type are required'
      });
    }
    
    const transaction = await logTransaction(transactionData);
    res.status(201).json({
      success: true,
      data: transaction
    });
  } catch (error) {
    console.error('Error logging transaction:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/transactions/audit
 * Log an audit trail entry
 */
router.post('/audit', async (req, res) => {
  try {
    const auditData = req.body;
    
    if (!auditData.tenant_id || !auditData.table_name || !auditData.record_id) {
      return res.status(400).json({
        success: false,
        error: 'tenant_id, table_name, and record_id are required'
      });
    }
    
    const audit = await logAuditTrail(auditData);
    res.status(201).json({
      success: true,
      data: audit
    });
  } catch (error) {
    console.error('Error logging audit trail:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/transactions/log
 * Get transaction log with filtering
 */
router.get('/log', async (req, res) => {
  try {
    const filters = {
      tenant_id: req.query.tenant_id,
      transaction_type: req.query.transaction_type,
      reference_type: req.query.reference_type,
      reference_id: req.query.reference_id,
      user_id: req.query.user_id,
      start_date: req.query.start_date,
      end_date: req.query.end_date,
      status: req.query.status,
      limit: req.query.limit ? parseInt(req.query.limit) : 100,
      offset: req.query.offset ? parseInt(req.query.offset) : 0
    };
    
    if (!filters.tenant_id) {
      return res.status(400).json({
        success: false,
        error: 'tenant_id is required'
      });
    }
    
    const transactions = await getTransactionLog(filters);
    res.json({
      success: true,
      data: transactions,
      count: transactions.length
    });
  } catch (error) {
    console.error('Error getting transaction log:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/transactions/audit
 * Get audit trail with filtering
 */
router.get('/audit', async (req, res) => {
  try {
    const filters = {
      tenant_id: req.query.tenant_id,
      table_name: req.query.table_name,
      record_id: req.query.record_id,
      action_type: req.query.action_type,
      changed_by: req.query.changed_by,
      start_date: req.query.start_date,
      end_date: req.query.end_date,
      limit: req.query.limit ? parseInt(req.query.limit) : 100,
      offset: req.query.offset ? parseInt(req.query.offset) : 0
    };
    
    if (!filters.tenant_id) {
      return res.status(400).json({
        success: false,
        error: 'tenant_id is required'
      });
    }
    
    const audits = await getAuditTrail(filters);
    res.json({
      success: true,
      data: audits,
      count: audits.length
    });
  } catch (error) {
    console.error('Error getting audit trail:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/transactions/statistics/:tenantId
 * Get transaction statistics for a tenant
 */
router.get('/statistics/:tenantId', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { start_date, end_date } = req.query;
    
    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        error: 'start_date and end_date are required'
      });
    }
    
    const statistics = await getTransactionStatistics(tenantId, start_date, end_date);
    res.json({
      success: true,
      data: statistics
    });
  } catch (error) {
    console.error('Error getting transaction statistics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/transactions/audit-statistics/:tenantId
 * Get audit statistics for a tenant
 */
router.get('/audit-statistics/:tenantId', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { start_date, end_date } = req.query;
    
    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        error: 'start_date and end_date are required'
      });
    }
    
    const statistics = await getAuditStatistics(tenantId, start_date, end_date);
    res.json({
      success: true,
      data: statistics
    });
  } catch (error) {
    console.error('Error getting audit statistics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
