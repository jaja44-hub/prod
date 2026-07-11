import { verifyBearerToken } from '../lib/firebaseAdmin.js';
import { enforceModuleAccess } from '../lib/policyOrchestrator.js';
import { buildModuleActivityEvents } from '../lib/productionSeed.js';

export function buildActivityTimeline(tenantId = 'production') {
  const now = Date.now();
  const timeline = [
    {
      activityId: 'act-001',
      type: 'email',
      subject: 'Introductory CRM workflow review',
      direction: 'outbound',
      performedBy: 'sales_rep',
      contact: 'Fikru Alem',
      occurredAt: new Date(now - 1000 * 60 * 60 * 26).toISOString(),
      tenantId,
    },
    {
      activityId: 'act-002',
      type: 'call',
      subject: 'Discovery call with Addis Importers',
      direction: 'inbound',
      performedBy: 'sales_manager',
      contact: 'Addis Importers',
      occurredAt: new Date(now - 1000 * 60 * 60 * 18).toISOString(),
      tenantId,
    },
    {
      activityId: 'act-003',
      type: 'meeting',
      subject: 'Qualification review for Nile Tech opportunity',
      direction: 'internal',
      performedBy: 'sales_head',
      contact: 'Nile Tech',
      occurredAt: new Date(now - 1000 * 60 * 60 * 12).toISOString(),
      tenantId,
    },
    {
      activityId: 'act-004',
      type: 'attachment',
      subject: 'Proposal document uploaded',
      fileName: 'proposal-nile-tech.pdf',
      mimeType: 'application/pdf',
      url: `https://example.com/tenant/${tenantId}/attachments/proposal-nile-tech.pdf`,
      linkedTo: 'opp-101',
      performedBy: 'sales_rep',
      occurredAt: new Date(now - 1000 * 60 * 60 * 8).toISOString(),
      tenantId,
    },
  ]; 
  return timeline;
}

export function normalizeActivityEntry(input = {}) {
  const now = new Date().toISOString();
  const id = input.activityId || `act-${Date.now()}`;
  const type = ['email', 'call', 'meeting', 'attachment'].includes(input.type)
    ? input.type
    : 'email';

  const base = {
    activityId: id,
    tenantId: input.tenantId || 'production',
    type,
    subject: String(input.subject || (type === 'attachment' ? 'Attachment uploaded' : 'CRM activity')).trim(),
    performedBy: input.performedBy || 'sales_rep',
    contact: input.contact || 'Unknown',
    occurredAt: input.occurredAt || now,
  };

  if (type === 'attachment') {
    return {
      ...base,
      fileName: String(input.fileName || 'attachment.bin'),
      mimeType: String(input.mimeType || 'application/octet-stream'),
      url: String(input.url || `https://example.com/attachments/${id}`),
      linkedTo: input.linkedTo || null,
    };
  }

  return {
    ...base,
    direction: input.direction || 'outbound',
    notes: input.notes || null,
  };
}

export function buildActivitySummary(timeline = []) {
  const eventCounts = timeline.reduce((acc, entry) => {
    acc[entry.type] = (acc[entry.type] || 0) + 1;
    return acc;
  }, {});

  const attachmentCount = timeline.filter((entry) => entry.type === 'attachment').length;
  const latestEvent = timeline
    .slice()
    .sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt))[0];

  return {
    totalActivities: timeline.length,
    attachmentCount,
    eventCounts,
    latestActivityAt: latestEvent?.occurredAt || null,
  };
}

export function createActivityRecord(data = {}) {
  return normalizeActivityEntry(data);
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
    await enforceModuleAccess(decoded || {}, 'crm', 'activity');
    const tenantId = decoded?.tenantId || decoded?.tenant_id || 'production';

    if (req.method === 'GET') {
      const timeline = buildActivityTimeline(tenantId);
      const summary = buildActivitySummary(timeline);
      const moduleEvents = buildModuleActivityEvents(tenantId);
      return res.status(200).json({ success: true, tenantId, timeline, summary, moduleEvents });
    }

    if (req.method === 'POST') {
      const payload = req.body || {};
      if (!payload.type) {
        return res.status(400).json({ error: 'Missing activity type' });
      }
      const activity = createActivityRecord({ ...payload, tenantId });
      return res.status(201).json({ success: true, tenantId, activity });
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (err) {
    console.error('[crm/activity] error', err?.message || err);
    return res.status(500).json({ success: false, error: err?.message || 'Internal' });
  }
}
