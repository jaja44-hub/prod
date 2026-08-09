import { verifyBearerToken } from '../lib/firebaseAdmin.js';
import { enforceModuleAccess } from '../lib/policyOrchestrator.js';
import { getPool, tableExists } from '../../../api/lib/shared.js';

function normalizeMovement(row, tenantId) {
  return {
    movementId: row.id ? String(row.id) : `move-${Date.now()}`,
    productId: row.product_id !== null && row.product_id !== undefined ? String(row.product_id) : '',
    qty: Number(row.quantity || 0),
    type: row.transaction_type || 'move',
    sourceLocation: row.location_id || null,
    destinationLocation: row.destination_location_id || null,
    timestamp: row.transaction_date || row.created_at || new Date().toISOString(),
    tenantId,
  };
}

export async function getMovements(tenantId = 'production', opts = {}) {
  const pool = getPool('analytics');
  if (!(await tableExists('inventory_transactions', pool))) {
    return [];
  }
  const result = await pool.query(
    `SELECT id, product_id, transaction_type, quantity, location_id, destination_location_id, transaction_date, created_at
     FROM inventory_transactions WHERE tenant_id = $1 ORDER BY transaction_date DESC LIMIT 100`,
    [tenantId]
  );
  return (result.rows || []).map((row) => normalizeMovement(row, tenantId));
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
    const decoded = await verifyBearerToken(req);
    if (!decoded) return res.status(401).json({ error: 'Unauthorized' });
    await enforceModuleAccess(decoded || {}, 'inventory', 'movements');
    const tenantId = decoded?.tenantId || decoded?.tenant_id || 'production';
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const rawDomain = url.searchParams.get('domain');
    const data = await getMovements(tenantId, { domain: rawDomain });
    return res.status(200).json({ success: true, data, meta: { tenantId } });
  } catch (err) {
    console.error('[inventory/movements] error', err?.message || err);
    return res.status(500).json({ success: false, error: err?.message || 'Internal' });
  }
}
