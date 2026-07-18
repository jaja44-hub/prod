/**
 * api/dashboard-metrics.js
 * Direct Neon DB handler for dashboard metrics (Vercel serverless compatible)
 */

import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.NEON_DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Content-Type, Authorization, X-Correlation-ID, X-Tenant-ID');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const tenantId = req.query.tenant_id || 'tenant_default';
    
    if (req.method === 'GET') {
      // Get sales revenue
      const revenueQuery = `
        SELECT COALESCE(SUM(total_amount), 0) as total_revenue
        FROM sales_orders
        WHERE tenant_id = $1 AND status IN ('confirmed', 'done')
      `;
      
      // Get sales orders count
      const ordersQuery = `
        SELECT COUNT(*) as total_orders
        FROM sales_orders
        WHERE tenant_id = $1
      `;
      
      // Get CRM pipeline value
      const pipelineQuery = `
        SELECT COALESCE(SUM(expected_value), 0) as pipeline_value
        FROM crm_opportunities
        WHERE tenant_id = $1 AND status IN ('prospecting', 'qualification', 'proposal')
      `;
      
      // Get warehouse ready-to-pick count
      const warehouseQuery = `
        SELECT COUNT(*) as ready_to_pick
        FROM warehouse_receipts
        WHERE tenant_id = $1 AND status = 'pending'
      `;
      
      // Get receivables
      const receivablesQuery = `
        SELECT COALESCE(SUM(total_credit), 0) as total_receivable
        FROM journal_entries
        WHERE tenant_id = $1 AND entry_type = 'SALES_INVOICE'
      `;
      
      // Get payables
      const payablesQuery = `
        SELECT COALESCE(SUM(total_debit), 0) as total_payable
        FROM journal_entries
        WHERE tenant_id = $1 AND entry_type = 'PURCHASE_ORDER'
      `;
      
      const [revenueResult, ordersResult, pipelineResult, warehouseResult, receivablesResult, payablesResult] = await Promise.all([
        pool.query(revenueQuery, [tenantId]),
        pool.query(ordersQuery, [tenantId]),
        pool.query(pipelineQuery, [tenantId]),
        pool.query(warehouseQuery, [tenantId]),
        pool.query(receivablesQuery, [tenantId]),
        pool.query(payablesQuery, [tenantId])
      ]);
      
      const metrics = {
        revenue: parseFloat(revenueResult.rows[0].total_revenue) || 0,
        orders: parseInt(ordersResult.rows[0].total_orders) || 0,
        pipelineValue: parseFloat(pipelineResult.rows[0].pipeline_value) || 0,
        warehouseReadyToPick: parseInt(warehouseResult.rows[0].ready_to_pick) || 0,
        receivables: parseFloat(receivablesResult.rows[0].total_receivable) || 0,
        payables: parseFloat(payablesResult.rows[0].total_payable) || 0,
        salesScore: 70,
        crmScore: 62,
        purchaseScore: 58,
        warehouseScore: 65,
        financeScore: 72
      };
      
      res.status(200).json({
        success: true,
        data: metrics
      });
    } else {
      res.status(405).json({ success: false, error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Dashboard metrics API error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}
