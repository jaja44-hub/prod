import { verifyBearerToken } from '../server/api/lib/firebaseAdmin.js';
import { enforceModuleAccess } from '../server/api/lib/policyOrchestrator.js';
import { buildSamplePipeline, buildPipelineSummary, createLeadRecord } from '../server/api/crm/pipeline.js';
import { buildActivityTimeline, buildActivitySummary, createActivityRecord, normalizeActivityEntry } from '../server/api/crm/activity.js';

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
    await enforceModuleAccess(decoded || {}, 'crm', 'access');
    const tenantId = decoded?.tenantId || decoded?.tenant_id || 'production';
    const action = String(req.query?.action || req.body?.action || 'pipeline').toLowerCase();

    if (req.method === 'GET' && action === 'pipeline') {
      const pipeline = buildSamplePipeline(tenantId);
      const summary = buildPipelineSummary(pipeline);
      return respond(res, 200, { success: true, tenantId, pipeline, summary });
    }

    if (req.method === 'POST' && action === 'pipeline') {
      const payload = req.body || {};
      const lead = createLeadRecord(payload);
      return respond(res, 201, { success: true, tenantId, lead });
    }

    if (req.method === 'GET' && action === 'activity') {
      const timeline = buildActivityTimeline(tenantId);
      const summary = buildActivitySummary(timeline);
      return respond(res, 200, { success: true, tenantId, timeline, summary });
    }

    if (req.method === 'POST' && action === 'activity') {
      const payload = req.body || {};
      if (!payload.type) {
        return respond(res, 400, { error: 'Missing activity type' });
      }
      const activity = createActivityRecord({ ...payload, tenantId });
      return respond(res, 201, { success: true, tenantId, activity });
    }

    return respond(res, 400, { error: 'Invalid crm action or method' });
  } catch (err) {
    console.error('[api/crm] error', err?.message || err);
    return respond(res, 500, { success: false, error: err?.message || 'Internal' });
  }
}
