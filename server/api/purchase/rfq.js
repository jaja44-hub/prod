import { verifyBearerToken } from '../lib/firebaseAdmin.js';
import { enforceModuleAccess } from '../lib/policyOrchestrator.js';
import { getPool, tableExists } from '../../../api/lib/shared.js';

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
  // Persist converted RFQ as a purchase order in Neon
  const pool = getPool('procurement');
  if (!(await tableExists('purchase_orders', pool))) {
    throw new Error('purchase_orders table not provisioned');
  }
  const total = rfq.lines.reduce((s, l) => s + Number(l.quantity || 0) * Number(l.unitPrice || 0), 0);
  const result = await pool.query(
    `INSERT INTO purchase_orders (tenant_id, order_number, supplier_id, expected_date, total_amount, status)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, order_number, supplier_id, expected_date, total_amount, status, created_at`,
    [tenantId, `PO-${Date.now()}`, rfq.vendorId || null, rfq.deliveryDate || new Date().toISOString(), total, 'purchase']
  );
  rfq.status = 'converted';
  rfq.convertedTo = { neonId: result.rows[0].id, poId: result.rows[0].order_number };
  return { rfq, po: result.rows[0] };
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
