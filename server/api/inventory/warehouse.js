import { verifyBearerToken } from '../lib/firebaseAdmin.js';
import { enforceModuleAccess } from '../lib/policyOrchestrator.js';
import { getWarehouseMetrics } from '../lib/neonAgingQueries.js';

function createId(prefix = 'wf') {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}-${Date.now()}`;
}

async function fetchOdooWarehouseData(tenantId) {
  try {
    const odooProxyUrl = process.env.ODOO_PROXY_URL || '/api/odooProxy';
    const response = await fetch(odooProxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': process.env.ODOO_PROXY_SKIP_AUTH === 'true' ? '' : `Bearer ${process.env.INTERNAL_API_TOKEN || ''}`,
      },
      body: JSON.stringify({
        model: 'stock.picking',
        method: 'search_read',
        args: [[['state', 'in', ['assigned', 'done', 'in_transit']]]],
        kwargs: {
          fields: ['id', 'name', 'state', 'picking_type_id', 'location_id', 'location_dest_id', 'scheduled_date', 'date_done'],
          limit: 50,
        },
        tenantId,
      }),
    });
    
    if (!response.ok) {
      console.warn('[warehouse] Odoo proxy request failed:', response.status);
      return null;
    }
    
    const result = await response.json();
    if (result.success && Array.isArray(result.data)) {
      return transformOdooPickings(result.data);
    }
    
    return null;
  } catch (err) {
    console.warn('[warehouse] Failed to fetch from Odoo proxy:', err?.message || err);
    return null;
  }
}

function transformNeonMetricsToWorkflow(neonMetrics) {
  const picks = [];
  const packs = [];
  const shipments = [];
  const transfers = [];
  
  for (const metric of neonMetrics) {
    const state = metric.state || 'draft';
    const pickId = metric.picking_id;
    
    if (state === 'assigned') {
      picks.push({
        pickId,
        orderId: pickId,
        productId: `prod-${metric.picking_type}`,
        sku: `SKU-${pickId}`,
        quantity: 1,
        status: 'ready',
        location: metric.location_src || 'WH-A',
        tenantId: 'production',
        dueAt: metric.scheduled_date || new Date().toISOString(),
      });
    }
    
    if (state === 'done') {
      packs.push({
        packId: `pack-${pickId}`,
        orderId: pickId,
        packageType: 'box',
        weightKg: 5.0,
        status: 'packed',
        tenantId: 'production',
        packedAt: metric.scheduled_date || new Date().toISOString(),
      });
      
      shipments.push({
        shipmentId: `ship-${pickId}`,
        orderId: pickId,
        carrier: 'Odoo Logistics',
        trackingNumber: `TRK-${pickId}`,
        status: 'delivered',
        shippedAt: metric.scheduled_date || new Date().toISOString(),
        estimatedDelivery: metric.scheduled_date || new Date().toISOString(),
        tenantId: 'production',
      });
    }
    
    if (state === 'in_transit') {
      shipments.push({
        shipmentId: `ship-${pickId}`,
        orderId: pickId,
        carrier: 'Odoo Logistics',
        trackingNumber: `TRK-${pickId}`,
        status: 'in_transit',
        shippedAt: metric.scheduled_date || new Date().toISOString(),
        estimatedDelivery: metric.scheduled_date || new Date().toISOString(),
        tenantId: 'production',
      });
    }
    
    transfers.push({
      transferId: `transfer-${pickId}`,
      orderId: pickId,
      productId: `prod-${metric.picking_type}`,
      type: 'internal_transfer',
      location: `${metric.location_src || 'WH-A'} → ${metric.location_dest || 'WH-B'}`,
      quantity: 10,
      sourceLocationId: metric.location_src || 'WH-A',
      destinationLocationId: metric.location_dest || 'WH-B',
      status: state === 'done' ? 'completed' : 'in_progress',
      tenantId: 'production',
      timestamp: metric.scheduled_date || new Date().toISOString(),
      createdAt: metric.scheduled_date || new Date().toISOString(),
      expectedAt: metric.scheduled_date || new Date().toISOString(),
    });
  }
  
  return { picks, packs, shipments, transfers };
}

export async function buildPickPackShipWorkflow(tenantId = 'production') {
  // Try Neon DB first for analytics
  try {
    const neonMetrics = await getWarehouseMetrics(tenantId);
    if (neonMetrics && neonMetrics.length > 0) {
      const workflow = transformNeonMetricsToWorkflow(neonMetrics);
      return {
        tenantId,
        picks: workflow.picks || [],
        packs: workflow.packs || [],
        shipments: workflow.shipments || [],
        transfers: workflow.transfers || [],
      };
    }
  } catch (err) {
    console.warn('[warehouse] Neon DB query failed, using empty fallback:', err?.message || err);
  }
  
  // Fallback to empty data
  return {
    tenantId,
    picks: [],
    packs: [],
    shipments: [],
    transfers: [],
  };
}

export function buildWarehouseSummary(workflow = {}) {
  const picks = Array.isArray(workflow.picks) ? workflow.picks : [];
  const packs = Array.isArray(workflow.packs) ? workflow.packs : [];
  const shipments = Array.isArray(workflow.shipments) ? workflow.shipments : [];
  const transfers = Array.isArray(workflow.transfers) ? workflow.transfers : [];

  return {
    totalPicks: picks.length,
    totalPacks: packs.length,
    totalShipments: shipments.length,
    totalTransfers: transfers.length,
    readyToPick: picks.filter((item) => item.status === 'ready').length,
    packedCount: packs.filter((item) => item.status === 'packed').length,
    shipmentsInTransit: shipments.filter((item) => item.status === 'in_transit').length,
    transfersPending: transfers.filter((item) => item.status === 'pending').length,
  };
}

export function normalizeWarehouseAction(input = {}) {
  const now = new Date().toISOString();
  return {
    actionId: input.actionId || `act-${Date.now()}`,
    tenantId: input.tenantId || 'production',
    type: input.type || 'shipment',
    orderId: input.orderId || null,
    productId: input.productId || null,
    quantity: Number(input.quantity || 0),
    status: input.status || 'pending',
    metadata: input.metadata || null,
    createdAt: input.createdAt || now,
  };
}

export function createShipmentRecord(data = {}) {
  const action = normalizeWarehouseAction({ ...data, type: 'shipment' });
  return {
    ...action,
    carrier: data.carrier || 'Local Courier',
    trackingNumber: data.trackingNumber || `TRACK-${Date.now()}`,
    estimatedDelivery: data.estimatedDelivery || new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
  };
}

export function createTransferRecord(data = {}) {
  return {
    transferId: data.transferId || createId('transfer'),
    orderId: data.orderId || null,
    productId: data.productId || null,
    quantity: Number(data.quantity || 0),
    sourceLocationId: data.sourceLocationId || 'WH-A',
    destinationLocationId: data.destinationLocationId || 'WH-B',
    status: data.status || 'pending',
    tenantId: data.tenantId || 'production',
    createdAt: data.createdAt || new Date().toISOString(),
    expectedAt: data.expectedAt || new Date(Date.now() + 1000 * 60 * 60 * 12).toISOString(),
    metadata: data.metadata || null,
  };
}

export function buildTransferRecord(data = {}) {
  return createTransferRecord(data);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Content-Type, Authorization'
  );

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const decoded = await verifyBearerToken(req);
    if (!decoded) return res.status(401).json({ error: 'Unauthorized' });
    await enforceModuleAccess(decoded || {}, 'inventory', 'warehouse');
    const tenantId = decoded?.tenantId || decoded?.tenant_id || 'production';

    if (req.method === 'GET') {
      const workflow = await buildPickPackShipWorkflow(tenantId);
      const summary = buildWarehouseSummary(workflow);
      return res.status(200).json({ success: true, tenantId, workflow, summary });
    }

    if (req.method === 'POST') {
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
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (err) {
    console.error('[inventory/warehouse] error', err?.message || err);
    return res.status(500).json({ success: false, error: err?.message || 'Internal' });
  }
}
