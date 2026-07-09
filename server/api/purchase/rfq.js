import { verifyBearerToken } from '../lib/firebaseAdmin.js';
import { enforceModuleAccess } from '../lib/policyOrchestrator.js';

const rfqStore = new Map();

function createId(prefix = 'rfq') { return `${prefix}-${Math.random().toString(36).slice(2,8)}-${Date.now()}`; }

export async function createRFQ(tenantId = 'production', payload = {}) {
  const id = createId();
  const rec = { rfqId: id, tenantId, vendorId: payload.vendorId || null, lines: Array.isArray(payload.lines) ? payload.lines : [], status: 'draft', createdAt: new Date().toISOString() };
  rfqStore.set(id, rec);
  return rec;
}

export async function createPOFromRFQ(rfqId, tenantId = 'production', actorUid = 'system') {
  const rfq = rfqStore.get(rfqId);
  if (!rfq || rfq.tenantId !== tenantId) throw new Error('RFQ not found');
  // try Odoo PO writeback
  try {
    let ServiceGateway = null;
    try { ServiceGateway = await import('../../../src/services/ServiceGateway.js'); } catch (e) { ServiceGateway = null; }
    const payload = { partner_id: rfq.vendorId, origin: rfq.rfqId, lines: rfq.lines.map((l) => ({ product_id: l.productId, quantity: l.quantity, unitPrice: l.unitPrice })) };
    const created = ServiceGateway?.createOdooPurchaseOrder ? await ServiceGateway.createOdooPurchaseOrder(payload, { actorUid }) : null;
    rfq.status = 'converted';
    rfq.convertedTo = { odooId: created?.id || null }; 
    return { rfq, po: created };
  } catch (err) {
    const po = { id: `po-${Date.now()}`, partnerId: rfq.vendorId, lines: rfq.lines, amount: rfq.lines.reduce((s,l)=> s + Number(l.quantity||0)*Number(l.unitPrice||0),0), state: 'draft' };
    rfq.status = 'converted';
    rfq.convertedTo = { odooId: po.id, stub: true };
    return { rfq, po };
  }
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
    await enforceModuleAccess(decoded || {}, 'purchase', 'rfq');
    const tenantId = decoded?.tenantId || decoded?.tenant_id || 'production';

    if (req.method === 'POST') {
      const payload = req.body || {};
      const rec = await createRFQ(tenantId, payload);
      return res.status(201).json({ success: true, data: rec, meta: { tenantId } });
    }

    if (req.method === 'GET') {
      const items = Array.from(rfqStore.values()).filter((r) => r.tenantId === tenantId);
      return res.status(200).json({ success: true, data: items, meta: { tenantId } });
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (err) {
    console.error('[purchase/rfq] error', err?.message || err);
    return res.status(500).json({ success: false, error: err?.message || 'Internal' });
  }
}
