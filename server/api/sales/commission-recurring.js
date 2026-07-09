/*
 * Commission and Recurring Orders helper + API
 */
import { verifyBearerToken } from '../lib/firebaseAdmin.js';
import { enforceModuleAccess } from '../lib/policyOrchestrator.js';

const commissionRates = {
  default: 0.05,
  premium: 0.08,
};

const commissionStore = new Map();
const recurringStore = new Map();

function createId(prefix = 'c') { return `${prefix}-${Math.random().toString(36).slice(2,8)}-${Date.now()}`; }

export function computeCommission({ amount = 0, productCategory = 'default', rateOverride = null } = {}) {
  const baseRate = rateOverride != null ? Number(rateOverride) : (commissionRates[productCategory] || commissionRates.default);
  const commission = Number(amount || 0) * Number(baseRate);
  return { amount: Number(amount || 0), rate: baseRate, commission: Number(commission.toFixed(2)) };
}

export async function createRecurringOrder(tenantId = 'production', payload = {}) {
  const id = createId('rec');
  const rec = {
    recurringId: id,
    tenantId,
    schedule: payload.schedule || { intervalDays: 30 },
    partnerId: payload.partnerId || null,
    lines: Array.isArray(payload.lines) ? payload.lines : [],
    status: 'active',
    nextRunAt: payload.nextRunAt || new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
    createdAt: new Date().toISOString(),
  };
  recurringStore.set(id, rec);
  return rec;
}

export function listRecurring(tenantId = 'production') {
  return Array.from(recurringStore.values()).filter((r) => r.tenantId === tenantId);
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
    await enforceModuleAccess(decoded || {}, 'sales', 'commission');
    const tenantId = decoded?.tenantId || decoded?.tenant_id || 'production';

    if (req.method === 'GET') {
      const list = listRecurring(tenantId);
      return res.status(200).json({ success: true, data: list, meta: { tenantId } });
    }

    if (req.method === 'POST') {
      const payload = req.body || {};
      if (payload.action === 'compute') {
        const result = computeCommission(payload);
        return res.status(200).json({ success: true, data: result });
      }
      const rec = await createRecurringOrder(tenantId, payload);
      return res.status(201).json({ success: true, data: rec, meta: { tenantId } });
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (err) {
    console.error('[sales/commission-recurring] error', err?.message || err);
    return res.status(500).json({ success: false, error: err?.message || 'Internal' });
  }
}
