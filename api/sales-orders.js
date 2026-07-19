/**
 * api/sales-orders.js
 * Direct Neon DB handler for sales orders (Vercel serverless compatible)
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
      const query = `
        SELECT 
          id,
          order_number,
          customer_id,
          customer_name,
          order_date,
          delivery_date,
          total_amount,
          status,
          payment_status,
          notes,
          created_at
        FROM sales_orders
        WHERE tenant_id = $1
        ORDER BY order_date DESC
        LIMIT 100
      `;
      
      const result = await pool.query(query, [tenantId]);
      
      res.status(200).json({
        success: true,
        data: result.rows,
        count: result.rows.length
      });
    } else if (req.method === 'POST') {
      const { customer_id, customer_name, order_date, delivery_date, total_amount, status, notes } = req.body;
      
      const query = `
        INSERT INTO sales_orders (tenant_id, customer_id, customer_name, order_date, delivery_date, total_amount, status, payment_status, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8)
        RETURNING *
      `;
      
      const result = await pool.query(query, [tenantId, customer_id, customer_name, order_date, delivery_date, total_amount, status || 'draft', notes]);
      
      res.status(201).json({
        success: true,
        data: result.rows[0]
      });
    } else {
      res.status(405).json({ success: false, error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Sales orders API error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}
