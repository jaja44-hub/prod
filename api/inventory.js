import { verifyBearerToken } from '../server/api/lib/firebaseAdmin.js';
import { enforceModuleAccess } from '../server/api/lib/policyOrchestrator.js';
import { buildPickPackShipWorkflow, buildWarehouseSummary, createShipmentRecord, normalizeWarehouseAction } from '../server/api/inventory/warehouse.js';
import { getMovements } from '../server/api/inventory/movements.js';
import { computeReorderSuggestion } from '../server/api/inventory/reorder-suggestion.js';

function respond(res, status, payload) {
  res.setHeader('Content-Type', 'application/json');
  return res.status(status).json(payload);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Content-Type, Authorization'
  );

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const authHeader = req.headers.authorization;
    const decoded = await verifyBearerToken(authHeader);
    if (!decoded) return respond(res, 401, { error: 'Unauthorized' });
    await enforceModuleAccess(decoded || {}, 'inventory', 'access');
    const tenantId = decoded?.tenantId || decoded?.tenant_id || 'production';
    const action = String(req.query?.action || req.body?.action || 'movements').toLowerCase();

    if (req.method === 'GET' && action === 'movements') {
      const data = await getMovements(tenantId);
      return respond(res, 200, { success: true, tenantId, data });
    }

    if (req.method === 'GET' && action === 'workflow') {
      const workflow = buildPickPackShipWorkflow(tenantId);
      const summary = buildWarehouseSummary(workflow);
      return respond(res, 200, { success: true, tenantId, workflow, summary });
    }

    if (req.method === 'POST' && action === 'suggestion') {
      const payload = req.body || {};
      const suggestion = computeReorderSuggestion(payload);
      return respond(res, 200, { success: true, tenantId, suggestion });
    }

    if (req.method === 'POST' && action === 'shipment') {
      const payload = req.body || {};
      if (!payload.orderId) {
        return respond(res, 400, { error: 'Missing orderId' });
      }
      const shipment = createShipmentRecord({ ...payload, tenantId });
      return respond(res, 201, { success: true, tenantId, shipment });
    }

    return respond(res, 400, { error: 'Invalid inventory action or method' });
  } catch (err) {
    console.error('[api/inventory] error', err?.message || err);
    return respond(res, 500, { success: false, error: err?.message || 'Internal' });
  }
}
