/**
 * Inventory Module API Router
 * Express router for inventory and warehouse-related endpoints
 */

const express = require('express');
const { Pool } = require('pg');
const router = express.Router();
const {
  buildPickPackShipWorkflow,
  buildWarehouseSummary,
  createShipmentRecord,
  createTransferRecord
} = require('./warehouse');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.NEON_DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

/**
 * GET /api/inventory/warehouse
 * Get warehouse workflow data (pick/pack/ship)
 */
router.get('/warehouse', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] || 'production';
    const workflow = await buildPickPackShipWorkflow(tenantId);
    const summary = buildWarehouseSummary(workflow);
    res.json({
      success: true,
      tenantId,
      workflow,
      summary
    });
  } catch (error) {
    console.error('Error getting warehouse workflow:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/inventory/warehouse
 * Create warehouse transfer or shipment
 */
router.post('/warehouse', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] || 'production';
    const payload = req.body || {};
    
    if (payload.type === 'transfer' || payload.action === 'transfer') {
      if (!payload.orderId || !payload.sourceLocationId || !payload.destinationLocationId) {
        return res.status(400).json({ error: 'Missing orderId, sourceLocationId, or destinationLocationId' });
      }
      const transfer = createTransferRecord({ ...payload, tenantId, status: 'pending' });
      return res.status(201).json({ success: true, tenantId, transfer });
    }

    if (!payload.orderId) {
      return res.status(400).json({ error: 'Missing orderId' });
    }
    const shipment = createShipmentRecord({ ...payload, tenantId });
    return res.status(201).json({ success: true, tenantId, shipment });
  } catch (error) {
    console.error('Error creating warehouse record:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

  /**
   * GET /api/inventory/products
   * List inventory products with optional search and tenant filters
   */
  router.get('/products', async (req, res) => {
    try {
      const tenantId = req.query.tenant_id || 'tenant_default';
      const search = req.query.search ? `%${req.query.search.toLowerCase()}%` : '%';
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : 100;
      const offset = req.query.offset ? parseInt(req.query.offset, 10) : 0;

      const query = `
        SELECT
          p.*,
          ec.name as category_name,
          COALESCE(SUM(wri.quantity_accepted), 0) AS quantity_available,
          COALESCE(ROUND(SUM(wri.quantity_accepted * wri.unit_cost), 2), 0) AS total_value
        FROM products p
        LEFT JOIN warehouse_receipt_items wri ON p.id = wri.product_id
        LEFT JOIN esic_categories ec ON p.category_id = ec.id
        WHERE p.tenant_id = $1
          AND (
            LOWER(p.name) LIKE $2
            OR LOWER(p.sku) LIKE $2
            OR CAST(p.id AS TEXT) = $3
          )
        GROUP BY p.id, ec.name
        ORDER BY p.name ASC
        LIMIT $4 OFFSET $5
      `;
      const values = [tenantId, search, req.query.search || '', limit, offset];
      const result = await pool.query(query, values);

      res.json({ success: true, data: result.rows, count: result.rows.length });
    } catch (error) {
      console.error('Error getting inventory products:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * GET /api/inventory/locations
   * Get static warehouse locations and delivery zones
   */
  router.get('/locations', async (req, res) => {
    try {
      const locations = [
        { id: 'wh-a-aisle-a', name: 'WH-A / Aisle A', complete_name: 'WH-A / Aisle A' },
        { id: 'wh-b-bulk', name: 'WH-B / Bulk', complete_name: 'WH-B / Bulk' },
        { id: 'wh-a-cold', name: 'WH-A / Cold', complete_name: 'WH-A / Cold' },
        { id: 'wh-b-pick-face', name: 'WH-B / Pick Face', complete_name: 'WH-B / Pick Face' },
        { id: 'wh-c-returns', name: 'WH-C / Returns', complete_name: 'WH-C / Returns' },
        { id: 'wh-a-high-value', name: 'WH-A / High Value', complete_name: 'WH-A / High Value' },
        { id: 'wh-b-overflow', name: 'WH-B / Overflow', complete_name: 'WH-B / Overflow' },
        { id: 'wh-a-quarantine', name: 'WH-A / Quarantine', complete_name: 'WH-A / Quarantine' },
        { id: 'vendor-dock', name: 'Vendor Dock', complete_name: 'Vendor Dock' },
      ]; 
      res.json({ success: true, data: locations, count: locations.length });
    } catch (error) {
      console.error('Error getting inventory locations:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  module.exports = router;
