/**
 * api/inventory-warehouse.js
 * Direct Neon DB handler for warehouse workflow (Vercel serverless compatible)
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
      // Get warehouse workflow data
      const pickingQuery = `
        SELECT COUNT(*) as count
        FROM warehouse_receipts
        WHERE tenant_id = $1 AND status = 'pending'
      `;
      
      const packedQuery = `
        SELECT COUNT(*) as count
        FROM warehouse_receipts
        WHERE tenant_id = $1 AND status = 'processed'
      `;
      
      const shippedQuery = `
        SELECT COUNT(*) as count
        FROM warehouse_receipts
        WHERE tenant_id = $1 AND status = 'shipped'
      `;
      
      const [pickingResult, packedResult, shippedResult] = await Promise.all([
        pool.query(pickingQuery, [tenantId]),
        pool.query(packedQuery, [tenantId]),
        pool.query(shippedQuery, [tenantId])
      ]);
      
      const workflow = {
        readyToPick: parseInt(pickingResult.rows[0].count) || 0,
        packedCount: parseInt(packedResult.rows[0].count) || 0,
        shipmentsInTransit: parseInt(shippedResult.rows[0].count) || 0
      };
      
      const summary = {
        totalOrders: workflow.readyToPick + workflow.packedCount + workflow.shipmentsInTransit,
        health: workflow.totalOrders > 0 ? 65 : 0
      };
      
      res.status(200).json({
        success: true,
        tenantId,
        workflow,
        summary
      });
    } else {
      res.status(405).json({ success: false, error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Warehouse workflow API error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}
