/**
 * Inventory Module API Router
 * Express router for inventory and warehouse-related endpoints
 */

const express = require('express');
const router = express.Router();
const {
  buildPickPackShipWorkflow,
  buildWarehouseSummary,
  createShipmentRecord,
  createTransferRecord
} = require('./warehouse');

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

module.exports = router;
