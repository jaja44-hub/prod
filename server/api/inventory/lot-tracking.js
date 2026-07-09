import { verifyBearerToken } from '../lib/firebaseAdmin.js';
import { enforceModuleAccess } from '../lib/policyOrchestrator.js';

const lots = new Map();

function makeId(prefix = 'lot') { return `${prefix}-${Math.random().toString(36).slice(2,8)}-${Date.now()}`; }

export function createLot({ productId, lotRef, qty = 0, receivedAt = new Date().toISOString(), meta = {} } = {}) {
  const id = makeId();
  const rec = { lotId: id, productId, lotRef: lotRef || id, qty: Number(qty || 0), receivedAt, meta };
  lots.set(id, rec);
  return rec;
}

export function adjustLotQty(lotId, delta) {
  const l = lots.get(lotId);
  if (!l) throw new Error('Lot not found');
  l.qty = Number(l.qty || 0) + Number(delta || 0);
  return l;
}

export function findByProduct(productId) {
  return Array.from(lots.values()).filter((l) => l.productId === productId);
}

export function getLots() { return Array.from(lots.values()); }

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  try {
    const decoded = await verifyBearerToken(req);
    if (!decoded) return res.status(401).json({ error: 'Unauthorized' });
    await enforceModuleAccess(decoded || {}, 'inventory', 'lot_tracking');
    const tenantId = decoded?.tenantId || 'production';
    if (req.method === 'POST') {
      const payload = req.body || {};
      const lot = createLot(payload);
      return res.status(201).json({ success: true, data: lot, tenantId });
    }
    if (req.method === 'PUT') {
      const body = req.body || {};
      if (body.action === 'adjust') {
        const updated = adjustLotQty(body.lotId, body.delta || 0);
        return res.status(200).json({ success: true, data: updated });
      }
      return res.status(400).json({ error: 'Unknown PUT action' });
    }
    if (req.method === 'GET') {
      const q = req.query || {};
      if (q.productId) return res.status(200).json({ success: true, data: findByProduct(q.productId), tenantId });
      return res.status(200).json({ success: true, data: getLots(), tenantId });
    }
    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (err) {
    console.error('[inventory/lot-tracking] error', err?.message || err);
    return res.status(500).json({ success: false, error: err?.message || 'Internal' });
  }
}
