import { verifyBearerToken } from '../lib/firebaseAdmin.js';
import { enforceModuleAccess } from '../lib/policyOrchestrator.js';

export function computeReorderSuggestion({ currentStock = 0, reorderPoint = 10, moq = 10 } = {}) {
  // Simple suggestion logic: if currentStock < reorderPoint, suggest ordering up to twice the reorderPoint, rounded to MOQs
  if (currentStock >= reorderPoint) return { shouldReorder: false, suggestedQty: 0 };
  const target = reorderPoint * 2;
  let suggested = Math.max(0, target - currentStock);
  // round up to MOQ
  if (moq > 1) {
    suggested = Math.ceil(suggested / moq) * moq;
  }
  return { shouldReorder: suggested > 0, suggestedQty: suggested };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Content-Type, Authorization'
  );

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });

  try {
    const authHeader = req.headers.authorization;
    const decoded = await verifyBearerToken(authHeader);
    if (!decoded) return res.status(401).json({ error: 'Unauthorized' });
    await enforceModuleAccess(decoded || {}, 'inventory', 'reorder');
    const tenantId = decoded?.tenantId || decoded?.tenant_id || 'production';
    const { productId, currentStock, reorderPoint, moq } = req.body || {};
    if (!productId) return res.status(400).json({ error: 'Missing productId' });
    const result = computeReorderSuggestion({ currentStock: Number(currentStock || 0), reorderPoint: Number(reorderPoint || 10), moq: Number(moq || 10) });
    return res.status(200).json({ success: true, productId, tenantId, result });
  } catch (err) {
    console.error('[inventory/reorder-suggestion] error', err?.message || err);
    return res.status(500).json({ success: false, error: err?.message || 'Internal' });
  }
}
