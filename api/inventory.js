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

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const tenantId = req.query.tenant_id || 'tenant_default';
    const path = req.url.split('?')[0];
    
    if (path.includes('/products')) return handleProducts(req, res, tenantId);
    if (path.includes('/locations')) return handleLocations(req, res, tenantId);
    if (path.includes('/warehouse')) return handleWarehouse(req, res, tenantId);
    if (path.includes('/cycle-counts')) return handleCycleCounts(req, res, tenantId);
    
    res.status(404).json({ success: false, error: 'Endpoint not found' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

async function handleProducts(req, res, tenantId) {
  const { search, location_id } = req.query;
  let query = `SELECT id, product_code, name, category, unit, cost_price, selling_price, stock_quantity, reorder_level, location_id, active, created_at FROM inventory_products WHERE tenant_id = $1`;
  const params = [tenantId];
  if (search) { query += ` AND (name ILIKE $${params.length + 1} OR product_code ILIKE $${params.length + 1})`; params.push(`%${search}%`); }
  if (location_id) { query += ` AND location_id = $${params.length + 1}`; params.push(location_id); }
  query += ` ORDER BY name ASC LIMIT 100`;
  const result = await pool.query(query, params);
  res.status(200).json({ success: true, data: result.rows, count: result.rows.length });
}

async function handleLocations(req, res, tenantId) {
  const result = await pool.query(`SELECT id, location_code, name, location_type, parent_id, active, created_at FROM inventory_locations WHERE tenant_id = $1 ORDER BY name ASC LIMIT 100`, [tenantId]);
  res.status(200).json({ success: true, data: result.rows, count: result.rows.length });
}

async function handleWarehouse(req, res, tenantId) {
  const result = await pool.query(`SELECT status, COUNT(*) as count FROM warehouse_receipts WHERE tenant_id = $1 GROUP BY status`, [tenantId]);
  const workflow = { picks: result.rows.filter(r => r.status === 'pending'), packs: result.rows.filter(r => r.status === 'processing'), shipments: result.rows.filter(r => r.status === 'shipped') };
  res.status(200).json({ success: true, data: { workflow, summary: { readyToPick: workflow.picks.length, totalPacks: workflow.packs.length, totalShipments: workflow.shipments.length } } });
}

async function handleCycleCounts(req, res, tenantId) {
  // Ensure table exists and has data
  await pool.query(`
    CREATE TABLE IF NOT EXISTS inventory_cycle_counts (
      id SERIAL PRIMARY KEY,
      tenant_id VARCHAR(50) NOT NULL,
      product_id INTEGER,
      location_id INTEGER,
      counted_quantity DECIMAL(10,2),
      expected_quantity DECIMAL(10,2),
      variance DECIMAL(10,2),
      status VARCHAR(20) DEFAULT 'pending',
      counted_by VARCHAR(100),
      counted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const countResult = await pool.query(`SELECT COUNT(*) as count FROM inventory_cycle_counts WHERE tenant_id = $1`, [tenantId]);
  if (countResult.rows[0].count === 0) {
    const sampleData = [
      { product_id: 1, location_id: 1, counted_quantity: 150, expected_quantity: 145, variance: 5, status: 'completed', counted_by: 'system' },
      { product_id: 2, location_id: 1, counted_quantity: 75, expected_quantity: 80, variance: -5, status: 'pending', counted_by: 'system' },
      { product_id: 3, location_id: 2, counted_quantity: 200, expected_quantity: 200, variance: 0, status: 'completed', counted_by: 'system' },
      { product_id: 4, location_id: 2, counted_quantity: 50, expected_quantity: 55, variance: -5, status: 'in_progress', counted_by: 'system' },
      { product_id: 5, location_id: 1, counted_quantity: 100, expected_quantity: 100, variance: 0, status: 'completed', counted_by: 'system' },
    ];
    for (const item of sampleData) {
      await pool.query(`INSERT INTO inventory_cycle_counts (tenant_id, product_id, location_id, counted_quantity, expected_quantity, variance, status, counted_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`, [tenantId, item.product_id, item.location_id, item.counted_quantity, item.expected_quantity, item.variance, item.status, item.counted_by]);
    }
  }

  const result = await pool.query(`SELECT id, product_id, location_id, counted_quantity, expected_quantity, variance, status, counted_by, counted_at FROM inventory_cycle_counts WHERE tenant_id = $1 ORDER BY counted_at DESC LIMIT 50`, [tenantId]);
  res.status(200).json({ success: true, data: result.rows, count: result.rows.length });
}
