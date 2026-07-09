import { verifyBearerToken } from '../lib/firebaseAdmin.js';
import { enforceModuleAccess } from '../lib/policyOrchestrator.js';
import { saveDocument } from '../system/persistence.js';

const auditStore = [];

export function logAuditEvent(event = {}) {
  const rec = { id: `audit-${Date.now()}-${Math.random().toString(36).slice(2,6)}`, timestamp: new Date().toISOString(), ...event };
  auditStore.push(rec);
  // attempt to persist
  try { saveDocument('audit', rec.id, rec).catch(() => {}); } catch (e) {}
  return rec;
}

export function listAuditEvents(limit = 100) {
  return auditStore.slice(-limit).reverse();
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
    await enforceModuleAccess(decoded || {}, 'audit', 'logging');
    const tenantId = decoded?.tenantId || 'production';
    if (req.method === 'POST') {
      const payload = req.body || {};
      const ev = logAuditEvent(payload);
      return res.status(201).json({ success: true, data: ev, tenantId });
    }
    if (req.method === 'GET') {
      const q = req.query || {};
      const limit = Number(q.limit || 100);
      return res.status(200).json({ success: true, data: listAuditEvents(limit), tenantId });
    }
    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (err) {
    console.error('[audit/logging] error', err?.message || err);
    return res.status(500).json({ success: false, error: err?.message || 'Internal' });
  }
}
