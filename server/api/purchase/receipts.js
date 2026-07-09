import { verifyBearerToken } from '../lib/firebaseAdmin.js';
import { enforceModuleAccess } from '../lib/policyOrchestrator.js';

const receiptsStore = new Map();

function createId(prefix = 'rcv') { return `${prefix}-${Math.random().toString(36).slice(2,8)}-${Date.now()}`; }

export async function createReceipt(tenantId = 'production', payload = {}) {
  const id = createId();
  const rec = { receiptId: id, tenantId, poId: payload.poId || null, lines: Array.isArray(payload.lines) ? payload.lines : [], receivedAt: new Date().toISOString(), status: 'received' };
  receiptsStore.set(id, rec);
  try { import('../system/persistence.js').then((m) => m.saveDocument('receipts', rec.receiptId, rec)).catch(() => {}); } catch (e) {}
  return rec;
}

export async function matchReceiptToPO(receiptId, tenantId = 'production') {
  const r = receiptsStore.get(receiptId);
  if (!r || r.tenantId !== tenantId) throw new Error('Receipt not found');
  // simple matching: return match object
  return { matched: !!r.poId, receipt: r, matchedTo: r.poId || null };
}

export async function computeLandedCost(receiptId, tenantId = 'production', extras = {}) {
  const r = receiptsStore.get(receiptId);
  if (!r || r.tenantId !== tenantId) throw new Error('Receipt not found');
  const subtotal = r.lines.reduce((s, l) => s + Number(l.qty || 0) * Number(l.unitCost || 0), 0);
  const freight = Number(extras.freight || 0);
  const duty = Number(extras.duty || 0);
  const handling = Number(extras.handling || 0);
  const landed = subtotal + freight + duty + handling;
  return { receiptId, tenantId, subtotal, freight, duty, handling, landedCost: landed, perLine: r.lines.map((l) => ({ productId: l.productId, qty: l.qty, unitCost: l.unitCost, landedUnitCost: ((Number(l.unitCost||0) * (subtotal ? subtotal/ subtotal : 1)) + freight + duty + handling) })) };
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
    await enforceModuleAccess(decoded || {}, 'purchase', 'receipts');
    const tenantId = decoded?.tenantId || decoded?.tenant_id || 'production';

    if (req.method === 'POST') {
      const payload = req.body || {};
      const rec = await createReceipt(tenantId, payload);
      return res.status(201).json({ success: true, data: rec, meta: { tenantId } });
    }

    if (req.method === 'GET') {
      const items = Array.from(receiptsStore.values()).filter((r) => r.tenantId === tenantId);
      return res.status(200).json({ success: true, data: items, meta: { tenantId } });
    }

    if (req.method === 'PUT') {
      const payload = req.body || {};
      if (payload.action === 'match') {
        const result = await matchReceiptToPO(payload.receiptId, tenantId);
        return res.status(200).json({ success: true, data: result });
      }
      if (payload.action === 'landedCost') {
        const result = await computeLandedCost(payload.receiptId, tenantId, payload.extras || {});
        return res.status(200).json({ success: true, data: result });
      }
      return res.status(400).json({ error: 'Unknown PUT action' });
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (err) {
    console.error('[purchase/receipts] error', err?.message || err);
    return res.status(500).json({ success: false, error: err?.message || 'Internal' });
  }
}
