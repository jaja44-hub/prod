import { verifyBearerToken } from '../lib/firebaseAdmin.js';
import { enforceModuleAccess } from '../lib/policyOrchestrator.js';

function createId(prefix = 'wf') {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}-${Date.now()}`;
}

export function buildPickPackShipWorkflow(tenantId = 'production') {
  const now = Date.now();
  const picks = [
    {
      pickId: 'pick-001',
      orderId: 'order-103',
      productId: 'prod-100',
      quantity: 12,
      status: 'ready',
      location: 'A1',
      tenantId,
      dueAt: new Date(now + 1000 * 60 * 60 * 6).toISOString(),
    },
    {
      pickId: 'pick-002',
      orderId: 'order-104',
      productId: 'prod-200',
      quantity: 5,
      status: 'in_progress',
      location: 'B2',
      tenantId,
      dueAt: new Date(now + 1000 * 60 * 60 * 8).toISOString(),
    },
  ];

  const packs = [
    {
      packId: 'pack-301',
      orderId: 'order-103',
      packageType: 'box',
      weightKg: 8.4,
      dimensionsCm: { length: 55, width: 35, height: 20 },
      status: 'packed',
      tenantId,
      packedAt: new Date(now - 1000 * 60 * 30).toISOString(),
    },
  ];

  const shipments = [
    {
      shipmentId: 'ship-501',
      orderId: 'order-102',
      carrier: 'DHL',
      trackingNumber: 'DHL-789012',
      status: 'in_transit',
      shippedAt: new Date(now - 1000 * 60 * 60 * 14).toISOString(),
      estimatedDelivery: new Date(now + 1000 * 60 * 60 * 24).toISOString(),
      tenantId,
    },
  ];

  const transfers = [
    {
      transferId: 'transfer-101',
      orderId: 'order-108',
      productId: 'prod-110',
      quantity: 30,
      sourceLocationId: 'WH-A',
      destinationLocationId: 'WH-B',
      status: 'pending',
      tenantId,
      createdAt: new Date(now - 1000 * 60 * 60 * 2).toISOString(),
      expectedAt: new Date(now + 1000 * 60 * 60 * 10).toISOString(),
    },
  ];

  return { tenantId, picks, packs, shipments, transfers };
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
      const workflow = buildPickPackShipWorkflow(tenantId);
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
