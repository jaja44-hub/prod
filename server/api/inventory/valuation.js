import { verifyBearerToken } from '../lib/firebaseAdmin.js';
import { enforceModuleAccess } from '../lib/policyOrchestrator.js';

const snapshots = new Map();

export function computeValuation({ items = [], method = 'fifo' } = {}) {
  // items: [{ productId, qty, unitCost, lotId, receivedAt }]
  if (!Array.isArray(items)) return { total: 0, lines: [] };
  const lines = [];
  if (method === 'fifo') {
    // sort by receivedAt asc
    const sorted = items.slice().sort((a,b) => new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime());
    let total = 0;
    for (const it of sorted) { const lineCost = Number(it.qty||0) * Number(it.unitCost||0); lines.push({ ...it, lineCost }); total += lineCost; }
    return { method: 'fifo', total, lines };
  }
  // lifo
  const sorted = items.slice().sort((a,b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());
  let total = 0;
  for (const it of sorted) { const lineCost = Number(it.qty||0) * Number(it.unitCost||0); lines.push({ ...it, lineCost }); total += lineCost; }
  return { method: 'lifo', total, lines };
}

export function snapshotInventory(name = `snapshot-${Date.now()}`, items = []) {
  const id = `${name}-${Math.random().toString(36).slice(2,8)}`;
  const rec = { id, name, createdAt: new Date().toISOString(), items };
  snapshots.set(id, rec);
  // try to persist snapshot (non-blocking)
  try { import('../system/persistence.js').then((m) => m.saveDocument('snapshots', rec.id, rec)).catch(() => {}); } catch (e) {}
  return rec;
}

export function getSnapshots() { return Array.from(snapshots.values()); }

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  try {
    const decoded = await verifyBearerToken(req);
    if (!decoded) return res.status(401).json({ error: 'Unauthorized' });
    await enforceModuleAccess(decoded || {}, 'inventory', 'valuation');
    const tenantId = decoded?.tenantId || 'production';
    if (req.method === 'POST') {
      const { action } = req.body || {};
      if (action === 'compute') {
        const resVal = computeValuation(req.body || {});
        return res.status(200).json({ success: true, data: resVal, tenantId });
      }
      if (action === 'snapshot') {
        const s = snapshotInventory(req.body.name, req.body.items || []);
        return res.status(201).json({ success: true, data: s, tenantId });
      }
      return res.status(400).json({ error: 'Unknown action' });
    }
    if (req.method === 'GET') {
      return res.status(200).json({ success: true, data: getSnapshots(), tenantId });
    }
    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (err) {
    console.error('[inventory/valuation] error', err?.message || err);
    return res.status(500).json({ success: false, error: err?.message || 'Internal' });
  }
}
