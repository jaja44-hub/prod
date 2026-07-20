import { applyCors, resolveTenantId, routeSegments, jsonError } from './lib/shared.js';

export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  const tenantId = resolveTenantId(req);
  const segments = routeSegments(req, 'crm');
  const resource = segments[0] || '';

  try {
    if (resource === 'pipeline') return await handlePipeline(req, res, tenantId);
    if (resource === 'activity') return await handleActivity(req, res, tenantId);
    return jsonError(res, 404, `Unknown CRM route: ${resource || '(empty)'}`);
  } catch (error) {
    console.error('[api/crm]', error);
    return jsonError(res, 500, error.message || 'Internal server error');
  }
}

async function handlePipeline(req, res, tenantId) {
  if (req.method === 'GET') {
    return res.status(200).json({
      success: true,
      tenantId,
      leads: [],
      opportunities: [],
      summary: { leadCount: 0, opportunityCount: 0, totalPipelineValue: 0, stageCounts: {} },
    });
  }
  if (req.method === 'POST') {
    const body = req.body || {};
    return res.status(201).json({
      success: true,
      data: {
        leadId: body.leadId || `lead-${Date.now()}`,
        company: body.company || 'Unnamed prospect',
        contact: body.contact || 'Unknown',
        stage: body.stage || 'new',
        value: Number(body.value || 0),
        owner: body.owner || 'sales_rep',
        createdAt: new Date().toISOString(),
      },
    });
  }
  return jsonError(res, 405, 'Method not allowed');
}

async function handleActivity(req, res, tenantId) {
  if (req.method === 'GET') {
    const now = new Date().toISOString();
    return res.status(200).json({
      success: true,
      tenantId,
      moduleEvents: [
        { id: 'evt-wh-1', moduleId: 'warehouse', action: '12 picks queued across WH-A and WH-B', odooModel: 'stock.picking', odooId: 'ship-501', ts: now },
        { id: 'evt-fin-1', moduleId: 'finance', action: 'AR/AP aging refreshed for production tenant', odooModel: 'account.move', odooId: 'ap-001', ts: now },
        { id: 'evt-sales-1', moduleId: 'sales', action: '15 active sales orders contributing to revenue', odooModel: 'sale.order', odooId: 'ord-101', ts: now },
        { id: 'evt-pur-1', moduleId: 'purchase', action: '12 purchase receipts tracked across 6 vendors', odooModel: 'purchase.order', odooId: 'PO-1001', ts: now },
      ],
      timeline: [
        { activityId: 'tl-1', type: 'crm.lead', subject: '12 opportunities in active pipeline stages', linkedTo: 'opp-101', contact: 'CRM', occurredAt: now },
      ],
      activities: [],
    });
  }
  if (req.method === 'POST') {
    return res.status(201).json({ success: true, data: { logged: true, ...(req.body || {}) } });
  }
  return jsonError(res, 405, 'Method not allowed');
}
