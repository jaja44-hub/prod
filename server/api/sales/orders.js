import { verifyBearerToken } from '../lib/firebaseAdmin.js';
import { enforceModuleAccess } from '../lib/policyOrchestrator.js';

const orderStore = new Map();

function createId(prefix = 'so') {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}-${Date.now()}`;
}

export async function createOrder(tenantId = 'production', payload = {}) {
  // try Odoo writeback via ServiceGateway
  try {
    let ServiceGateway = null;
    try { ServiceGateway = await import('../../../src/services/ServiceGateway.js'); } catch (e) { ServiceGateway = null; }
    const created = ServiceGateway?.createOdooSalesOrder ? await ServiceGateway.createOdooSalesOrder({ partner_id: payload.partnerId, origin: payload.origin || '', lines: payload.lines || [] }, { actorUid: payload.actorUid }) : null;
    if (created) return { source: 'odoo', order: created };
    throw new Error('Odoo create not available');
  } catch (err) {
    const id = createId('ord');
    const record = { id, name: payload.name || `Order ${id}`, partnerId: payload.partnerId || null, lines: payload.lines || [], amount_total: payload.lines ? payload.lines.reduce((s, l) => s + Number(l.quantity || 0) * Number(l.unitPrice || 0), 0) : 0, state: 'draft', tenantId };
    orderStore.set(id, record);
    try { const SG = (await import('../../../src/services/ServiceGateway.js')).default; if (SG?.logAuditEvent) await SG.logAuditEvent({ entityType: 'sales', action: 'order.create', entityId: id, tenantId, success: true }); } catch (e) {}
    return { source: 'stub', order: record };
  }
}

export async function getOrders(tenantId = 'production') {
  return Array.from(orderStore.values()).filter((o) => o.tenantId === tenantId);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  try {
    const decoded = await verifyBearerToken(req);
    if (!decoded) return res.status(401).json({ error: 'Unauthorized' });
    await enforceModuleAccess(decoded || {}, 'sales', 'orders');
    const tenantId = decoded?.tenantId || decoded?.tenant_id || 'production';

    if (req.method === 'GET') {
      const data = await getOrders(tenantId);
      return res.status(200).json({ success: true, data, meta: { tenantId } });
    }

    if (req.method === 'POST') {
      const payload = req.body || {};
      const result = await createOrder(tenantId, payload);
      return res.status(201).json({ success: true, data: result.order, meta: { tenantId, source: result.source } });
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (err) {
    console.error('[sales/orders] error', err?.message || err);
    return res.status(500).json({ success: false, error: err?.message || 'Internal' });
  }
}
