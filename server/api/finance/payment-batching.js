import { verifyBearerToken } from '../lib/firebaseAdmin.js';
import { enforceModuleAccess } from '../lib/policyOrchestrator.js';

const batches = new Map();

export function createBatch(payments = [], batchOpts = {}) {
  const id = `batch-${Math.random().toString(36).slice(2,8)}-${Date.now()}`;
  const batch = { id, createdAt: new Date().toISOString(), payments: Array.isArray(payments) ? payments : [], opts: batchOpts, status: 'created' };
  batches.set(id, batch);
  try { import('../system/persistence.js').then((m) => m.saveDocument('batches', batch.id, batch)).catch(() => {}); } catch (e) {}
  return batch;
}

export function importBankFeed(lines = []) {
  // lines: [{ bankRef, amount, currency, date, reference }]
  // simple mapping to payments
  return lines.map((ln, idx) => ({ paymentId: `bk-${Date.now()}-${idx}`, amount: Number(ln.amount || 0), currency: ln.currency || 'USD', date: ln.date || new Date().toISOString(), reference: ln.reference || ln.bankRef || null }));
}

export function listBatches() { return Array.from(batches.values()); }

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  try {
    const decoded = await verifyBearerToken(req);
    if (!decoded) return res.status(401).json({ error: 'Unauthorized' });
    await enforceModuleAccess(decoded || {}, 'finance', 'payment_batching');
    const tenantId = decoded?.tenantId || 'production';
    if (req.method === 'POST') {
      const { action } = req.body || {};
      if (action === 'create') {
        const b = createBatch(req.body.payments || [], req.body.opts || {});
        return res.status(201).json({ success: true, data: b, tenantId });
      }
      if (action === 'import') {
        const payments = importBankFeed(req.body.lines || []);
        return res.status(200).json({ success: true, data: payments, tenantId });
      }
      return res.status(400).json({ error: 'Unknown action' });
    }
    if (req.method === 'GET') {
      return res.status(200).json({ success: true, data: listBatches(), tenantId });
    }
    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (err) {
    console.error('[finance/payment-batching] error', err?.message || err);
    return res.status(500).json({ success: false, error: err?.message || 'Internal' });
  }
}
