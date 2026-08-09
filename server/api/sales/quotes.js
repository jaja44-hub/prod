import { verifyBearerToken } from '../lib/firebaseAdmin.js';
import { enforceModuleAccess } from '../lib/policyOrchestrator.js';
import { createOrder } from './orders.js';

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
  // Persist converted quote as a sales order in Neon
  const result = await createOrder(tenantId, {
    orderNumber: `SO-${q.name.replace(/\s+/g, '-')}`,
    customerName: q.partnerName || null,
    lines: q.lines.map((l) => ({ quantity: l.quantity, unitPrice: l.unitPrice, productId: l.productId })),
    status: 'draft',
  });
  q.state = 'converted';
  q.convertedTo = { neonId: result.id, createdAt: new Date().toISOString() };
  return { quote: q, order: result.order };
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
