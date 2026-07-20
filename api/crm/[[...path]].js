import { applyCors, resolveTenantId, routeSegments, jsonError } from '../lib/shared.js';

export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  const tenantId = resolveTenantId(req);
  const segments = routeSegments(req);
  const resource = segments[0] || '';

  try {
    if (resource === 'pipeline') return handlePipeline(req, res, tenantId);
    if (resource === 'activity') return handleActivity(req, res, tenantId);
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
    return res.status(200).json({
      success: true,
      tenantId,
      activities: [
        {
          id: 'act-1',
          type: 'note',
          subject: 'Pipeline sync',
          detail: 'CRM activity feed connected to Vercel API gateway',
          createdAt: new Date().toISOString(),
        },
      ],
    });
  }
  if (req.method === 'POST') {
    return res.status(201).json({ success: true, data: { logged: true, ...(req.body || {}) } });
  }
  return jsonError(res, 405, 'Method not allowed');
}
