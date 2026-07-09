import { verifyBearerToken } from '../lib/firebaseAdmin.js';
import { enforceModuleAccess } from '../lib/policyOrchestrator.js';

export async function getMovements(tenantId = 'production') {
  // Stubbed, tenant-scoped movement history
  const now = Date.now();
  return [
    { productId: 'prod-100', qty: -10, type: 'sale', timestamp: new Date(now - 1000 * 60 * 60 * 24).toISOString() },
    { productId: 'prod-100', qty: 50, type: 'purchase', timestamp: new Date(now - 1000 * 60 * 60 * 48).toISOString() },
    { productId: 'prod-200', qty: -2, type: 'transfer', timestamp: new Date(now - 1000 * 60 * 60 * 6).toISOString() },
  ].map((m, i) => ({ ...m, tenantId }));
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Content-Type, Authorization'
  );

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Use GET' });

  try {
    const authHeader = req.headers.authorization;
    const decoded = await verifyBearerToken(authHeader);
    if (!decoded) return res.status(401).json({ error: 'Unauthorized' });
    await enforceModuleAccess(decoded || {}, 'inventory', 'movements');
    const tenantId = decoded?.tenantId || decoded?.tenant_id || 'production';
    const data = await getMovements(tenantId);
    return res.status(200).json({ success: true, data, meta: { tenantId } });
  } catch (err) {
    console.error('[inventory/movements] error', err?.message || err);
    return res.status(500).json({ success: false, error: err?.message || 'Internal' });
  }
}
