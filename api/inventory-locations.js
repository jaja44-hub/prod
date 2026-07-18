/**
 * api/inventory-locations.js
 * Direct Neon DB handler for inventory locations (Vercel serverless compatible)
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
          location_code,
          name,
          location_type,
          address,
          city,
          region,
          active,
          created_at
        FROM inventory_locations
        WHERE tenant_id = $1
        ORDER BY name ASC
        LIMIT 100
      `;
      
      const result = await pool.query(query, [tenantId]);
      
      res.status(200).json({
        success: true,
        data: result.rows,
        count: result.rows.length
      });
    } else {
      res.status(405).json({ success: false, error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Inventory locations API error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}
