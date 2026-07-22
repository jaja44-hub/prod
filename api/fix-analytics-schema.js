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
    
    return res.status(200).json({ success: true, message: 'Schema fixed' });
  } catch (error) {
    console.error('Schema fix error:', error);
    return jsonError(res, 500, error.message || 'Failed to fix schema');
  }
}
