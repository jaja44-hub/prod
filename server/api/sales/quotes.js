import { verifyBearerToken } from '../lib/firebaseAdmin.js';
import { enforceModuleAccess } from '../lib/policyOrchestrator.js';

const quoteStore = new Map();

function createId(prefix = 'q') {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}-${Date.now()}`;
}

export async function createQuote(tenantId = 'production', payload = {}) {
  const id = createId('quote');
  const record = {
    quoteId: id,
    id,
    name: payload.name || `Quote ${id}`,
    partnerId: payload.partnerId || null,
    lines: Array.isArray(payload.lines) ? payload.lines : [],
    state: 'draft',
    createdAt: new Date().toISOString(),
    tenantId,
  };
  quoteStore.set(id, record);
  return record;
}

export async function getQuotes(tenantId = 'production') {
  return Array.from(quoteStore.values()).filter((q) => q.tenantId === tenantId);
}

export async function convertQuoteToOrder(quoteId, tenantId = 'production', actorUid = 'system') {
  const q = quoteStore.get(quoteId);
  if (!q || q.tenantId !== tenantId) throw new Error('Quote not found');
  // attempt Odoo writeback
  try {
    let ServiceGateway = null;
    try { ServiceGateway = await import('../../../src/services/ServiceGateway.js'); } catch (e) { ServiceGateway = null; }
    const payload = { partner_id: q.partnerId || null, origin: q.name, lines: q.lines.map((l) => ({ product_id: l.productId, quantity: l.quantity, unitPrice: l.unitPrice })) };
    const created = ServiceGateway?.createOdooSalesOrder ? await ServiceGateway.createOdooSalesOrder(payload, { actorUid }) : null;
    if (!created) throw new Error('Odoo create not available');
    // mark quote converted
    q.state = 'converted';
    q.convertedTo = { odooId: created?.id || null, createdAt: new Date().toISOString() };
    // audit
    try { if (ServiceGateway?.logAuditEvent) await ServiceGateway.logAuditEvent({ entityType: 'sales', action: 'quote.convert', entityId: q.quoteId, tenantId, success: true, actor: actorUid }); } catch (e) {}
    return { quote: q, order: created };
  } catch (err) {
    // fallback stub order
    const order = { id: `ord-${Date.now()}`, name: `SO-${Date.now()}`, partnerId: q.partnerId, amount_total: q.lines.reduce((s, l) => s + Number(l.quantity || 0) * Number(l.unitPrice || 0), 0), state: 'draft', order_lines: q.lines };
    q.state = 'converted';
    q.convertedTo = { odooId: order.id, createdAt: new Date().toISOString(), stub: true };
    try { const SG = (await import('../../../src/services/ServiceGateway.js')).default; if (SG?.logAuditEvent) await SG.logAuditEvent({ entityType: 'sales', action: 'quote.convert', entityId: q.quoteId, tenantId, success: true, actor: actorUid, meta: { stub: true } }); } catch (e) {}
    return { quote: q, order };
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
    await enforceModuleAccess(decoded || {}, 'sales', 'quotes');
    const tenantId = decoded?.tenantId || decoded?.tenant_id || 'production';

    if (req.method === 'GET') {
      const data = await getQuotes(tenantId);
      return res.status(200).json({ success: true, data, meta: { tenantId } });
    }

    if (req.method === 'POST') {
      const payload = req.body || {};
      const rec = await createQuote(tenantId, payload);
      return res.status(201).json({ success: true, data: rec, meta: { tenantId } });
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (err) {
    console.error('[sales/quotes] error', err?.message || err);
    return res.status(500).json({ success: false, error: err?.message || 'Internal' });
  }
}
