import { verifyBearerToken } from '../lib/firebaseAdmin.js';
import { enforceModuleAccess } from '../lib/policyOrchestrator.js';

export function buildSamplePipeline(tenantId = 'production') {
  const now = Date.now();
  const leads = [
    { leadId: 'lead-001', company: 'Nile Tech', contact: 'Mona Tesfaye', stage: 'new', value: 0, owner: 'sales_manager', createdAt: new Date(now - 1000 * 60 * 60 * 24 * 5).toISOString() },
    { leadId: 'lead-002', company: 'Blue Ridge Trading', contact: 'Hanna Solomon', stage: 'qualified', value: 0, owner: 'sales_executive', createdAt: new Date(now - 1000 * 60 * 60 * 24 * 12).toISOString() },
  ];
  const opportunities = [
    { opportunityId: 'opp-101', company: 'Harmony Logistics', amount: 18000, stage: 'proposal', owner: 'sales_head', expectedClose: new Date(now + 1000 * 60 * 60 * 24 * 18).toISOString(), lastActivity: new Date(now - 1000 * 60 * 60 * 24 * 2).toISOString() },
    { opportunityId: 'opp-102', company: 'Ethio FMCG', amount: 7500, stage: 'negotiation', owner: 'sales_manager', expectedClose: new Date(now + 1000 * 60 * 60 * 24 * 30).toISOString(), lastActivity: new Date(now - 1000 * 60 * 60 * 24 * 6).toISOString() },
  ];
  return { tenantId, leads, opportunities };
}

export function normalizePipelineLead(input = {}) {
  return {
    leadId: input.leadId || `lead-${Date.now()}`,
    company: input.company || 'Unnamed prospect',
    contact: input.contact || 'Unknown',
    stage: input.stage || 'new',
    value: Number(input.value || 0),
    owner: input.owner || 'sales_rep',
    createdAt: input.createdAt || new Date().toISOString(),
  };
}

export function buildPipelineSummary(pipeline = {}) {
  const leads = Array.isArray(pipeline.leads) ? pipeline.leads : [];
  const opportunities = Array.isArray(pipeline.opportunities) ? pipeline.opportunities : [];
  const stageCounts = opportunities.reduce((acc, opp) => {
    acc[opp.stage] = (acc[opp.stage] || 0) + 1;
    return acc;
  }, {});
  const totalPipelineValue = opportunities.reduce((sum, opp) => sum + Number(opp.amount || 0), 0);
  return {
    leadCount: leads.length,
    opportunityCount: opportunities.length,
    totalPipelineValue,
    stageCounts,
  };
}

export function createLeadRecord(data = {}) {
  return normalizePipelineLead(data);
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
    if (!decoded) return res.status(401).json({ error: 'Unauthorized' });
    await enforceModuleAccess(decoded || {}, 'crm', 'pipeline');
    const tenantId = decoded?.tenantId || decoded?.tenant_id || 'production';

    if (req.method === 'GET') {
      const pipeline = buildSamplePipeline(tenantId);
      const summary = buildPipelineSummary(pipeline);
      return res.status(200).json({ success: true, tenantId, pipeline, summary });
    }

    if (req.method === 'POST') {
      const payload = req.body || {};
      const lead = createLeadRecord(payload);
      return res.status(201).json({ success: true, tenantId, lead });
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (err) {
    console.error('[crm/pipeline] error', err?.message || err);
    return res.status(500).json({ success: false, error: err?.message || 'Internal' });
  }
}
