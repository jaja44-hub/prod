import { verifyBearerToken } from '../lib/firebaseAdmin.js';
import { enforceModuleAccess } from '../lib/policyOrchestrator.js';

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

  return { tenantId, picks, packs, shipments };
}

export function buildWarehouseSummary(workflow = {}) {
  const picks = Array.isArray(workflow.picks) ? workflow.picks : [];
  const packs = Array.isArray(workflow.packs) ? workflow.packs : [];
  const shipments = Array.isArray(workflow.shipments) ? workflow.shipments : [];

  return {
    totalPicks: picks.length,
    totalPacks: packs.length,
    totalShipments: shipments.length,
    readyToPick: picks.filter((item) => item.status === 'ready').length,
    packedCount: packs.filter((item) => item.status === 'packed').length,
    shipmentsInTransit: shipments.filter((item) => item.status === 'in_transit').length,
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
    const authHeader = req.headers.authorization;
    const decoded = await verifyBearerToken(authHeader);
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
