import { verifyBearerToken } from '../lib/firebaseAdmin.js';
import { enforceModuleAccess } from '../lib/policyOrchestrator.js';

const labels = new Map();

export function generateLabel(shipment = {}, carrier = 'ethiopost') {
  const id = `lbl-${Math.random().toString(36).slice(2,8)}-${Date.now()}`;
  const label = {
    id,
    carrier,
    tracking: `${carrier.toUpperCase().slice(0,3)}-${Math.random().toString(36).slice(2,8)}`,
    createdAt: new Date().toISOString(),
    format: 'pdf',
    data: `LABEL:${id}:TO:${shipment.toAddress||'unknown'}`,
    shipment,
  };
  labels.set(id, label);
  return label;
}

export function listLabels() { return Array.from(labels.values()); }

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  try {
    const decoded = await verifyBearerToken(req);
    if (!decoded) return res.status(401).json({ error: 'Unauthorized' });
    await enforceModuleAccess(decoded || {}, 'shipping', 'label_service');
    const tenantId = decoded?.tenantId || 'production';
    if (req.method === 'POST') {
      const { shipment, carrier } = req.body || {};
      const lbl = generateLabel(shipment || {}, carrier || 'ethiopost');
      return res.status(201).json({ success: true, data: lbl, tenantId });
    }
    if (req.method === 'GET') {
      return res.status(200).json({ success: true, data: listLabels(), tenantId });
    }
    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (err) {
    console.error('[shipping/label-service] error', err?.message || err);
    return res.status(500).json({ success: false, error: err?.message || 'Internal' });
  }
}
