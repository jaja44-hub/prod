import { jsonError } from './lib/shared.js';
import { getPool } from './lib/shared.js';

export default async function handler(req, res) {
  try {
    const analyticsPool = getPool('analytics');
    await analyticsPool.query(`ALTER TABLE inventory_products ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
    await analyticsPool.query(`ALTER TABLE inventory_products ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(100) DEFAULT 'tenant_default'`);
    await analyticsPool.query(`ALTER TABLE inventory_locations ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
    await analyticsPool.query(`ALTER TABLE inventory_locations ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(100) DEFAULT 'tenant_default'`);
    await analyticsPool.query(`ALTER TABLE inventory_transactions ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(100) DEFAULT 'tenant_default'`);
    await analyticsPool.query(`ALTER TABLE inventory_cycle_counts ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(100) DEFAULT 'tenant_default'`);
    
    const procurementPool = getPool('procurement');
    await procurementPool.query(`ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
    await procurementPool.query(`ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(100) DEFAULT 'tenant_default'`);
    await procurementPool.query(`ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(100) DEFAULT 'tenant_default'`);
    
    const accountingPool = getPool('accounting');
    await accountingPool.query(`CREATE TABLE IF NOT EXISTS customers (id SERIAL PRIMARY KEY, customer_code VARCHAR(50) UNIQUE NOT NULL, name VARCHAR(200) NOT NULL, email VARCHAR(100), phone VARCHAR(50), city VARCHAR(100), country VARCHAR(100), credit_limit DECIMAL(12, 2), active BOOLEAN DEFAULT true, tenant_id VARCHAR(100) DEFAULT 'tenant_default', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
    await accountingPool.query(`INSERT INTO customers (customer_code, name, email, phone, city, country, credit_limit, active) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT DO NOTHING`, ['CUST-001', 'Ethio Telecom', 'procurement@ethiotelecom.et', '+251-11-555-0000', 'Addis Ababa', 'Ethiopia', 500000.00, true]);
    await accountingPool.query(`INSERT INTO customers (customer_code, name, email, phone, city, country, credit_limit, active) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT DO NOTHING`, ['CUST-002', 'Commercial Bank of Ethiopia', 'purchasing@cbe.com.et', '+251-11-555-1111', 'Addis Ababa', 'Ethiopia', 750000.00, true]);
    await accountingPool.query(`INSERT INTO customers (customer_code, name, email, phone, city, country, credit_limit, active) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT DO NOTHING`, ['CUST-003', 'Ethiopian Airlines', 'supply@ethiopianairlines.com', '+251-11-665-0000', 'Addis Ababa', 'Ethiopia', 1000000.00, true]);
    await accountingPool.query(`INSERT INTO customers (customer_code, name, email, phone, city, country, credit_limit, active) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT DO NOTHING`, ['CUST-004', 'MIDROC Ethiopia', 'orders@midroc.com.et', '+251-11-555-2222', 'Addis Ababa', 'Ethiopia', 600000.00, true]);
    await accountingPool.query(`INSERT INTO customers (customer_code, name, email, phone, city, country, credit_limit, active) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT DO NOTHING`, ['CUST-005', 'BGI Ethiopia', 'procurement@bgi.com.et', '+251-11-555-3333', 'Addis Ababa', 'Ethiopia', 400000.00, true]);
    
    return res.status(200).json({ success: true, message: 'Schema fixed' });
  } catch (error) {
    console.error('Schema fix error:', error);
    return jsonError(res, 500, error.message || 'Failed to fix schema');
  }
}
