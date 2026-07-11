import { verifyBearerToken } from '../lib/firebaseAdmin.js';
import { enforceModuleAccess } from '../lib/policyOrchestrator.js';
import { getTenantDataset, saveTenantDataset } from '../lib/moduleDataStore.js';
import { buildCycleCountsSeed } from '../lib/productionSeedCatalog.js';

function createId(prefix = 'cc') {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}-${Date.now()}`;
}

function buildCycleCountRecord({ tenantId, name, locationId, expectedQuantities = [], countedBy = 'system', dueDate = null }) {
  return {
    cycleCountId: createId('cc'),
    name: name || `Cycle Count ${new Date().toISOString()}`,
    locationId: locationId || 'default-location',
    state: 'draft',
    createdAt: new Date().toISOString(),
    dueDate: dueDate || new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
    expectedQuantities,
    countedBy,
    adjustments: [],
    tenantId,
  };
}

async function loadCycleCountDataset(tenantId) {
  return getTenantDataset(tenantId, 'cycle_counts', buildCycleCountsSeed);
}

export async function seedCycleCounts(tenantId = 'production') {
  const dataset = await loadCycleCountDataset(tenantId);
  return Array.isArray(dataset?.records) ? dataset.records : [];
}

export async function getCycleCounts(tenantId = 'production') {
  return seedCycleCounts(tenantId);
}

async function persistRecords(tenantId, records) {
  const dataset = await loadCycleCountDataset(tenantId);
  await saveTenantDataset(tenantId, 'cycle_counts', { ...dataset, records });
}

export async function createCycleCount(tenantId, payload = {}) {
  const record = buildCycleCountRecord({ tenantId, ...payload });
  const records = [...await getCycleCounts(tenantId), record];
  await persistRecords(tenantId, records);
  return record;
}

export async function updateCycleCount(cycleCountId, tenantId, changes = {}) {
  const records = await getCycleCounts(tenantId);
  const index = records.findIndex((item) => item.cycleCountId === cycleCountId);
  if (index < 0) throw new Error('Cycle count not found');
  const updated = { ...records[index], ...changes, updatedAt: new Date().toISOString() };
  records[index] = updated;
  await persistRecords(tenantId, records);
  return updated;
}

export async function applyCycleCountAdjustment(cycleCountId, tenantId, adjustment = {}) {
  const records = await getCycleCounts(tenantId);
  const index = records.findIndex((item) => item.cycleCountId === cycleCountId);
  if (index < 0) throw new Error('Cycle count not found');
  const existing = records[index];
  const adjustmentRecord = {
    adjustmentId: createId('adj'),
    adjustedAt: new Date().toISOString(),
    countedBy: adjustment.countedBy || existing.countedBy,
    quantityCounted: Number(adjustment.quantityCounted || 0),
    expectedQuantity: Number(adjustment.expectedQuantity || 0),
    variance: Number(adjustment.quantityCounted || 0) - Number(adjustment.expectedQuantity || 0),
    locationId: existing.locationId,
    reason: adjustment.reason || 'manual adjustment',
    tenantId,
  };
  const updated = {
    ...existing,
    state: 'adjusted',
    adjustments: [...(existing.adjustments || []), adjustmentRecord],
    updatedAt: new Date().toISOString(),
  };
  records[index] = updated;
  await persistRecords(tenantId, records);
  return { cycleCount: updated, adjustment: adjustmentRecord };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Content-Type, Authorization'
  );

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const decoded = await verifyBearerToken(req);
    if (!decoded) return res.status(401).json({ error: 'Unauthorized' });
    await enforceModuleAccess(decoded || {}, 'inventory', 'cycle_count');
    const tenantId = decoded?.tenantId || decoded?.tenant_id || 'production';

    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const path = url.pathname;

    if (req.method === 'GET') {
      const data = await getCycleCounts(tenantId);
      return res.status(200).json({ success: true, data, meta: { tenantId } });
    }

    if (req.method === 'POST') {
      const payload = req.body || {};
      if (path.endsWith('/adjust')) {
        const { cycleCountId, quantityCounted, expectedQuantity, countedBy, reason } = payload;
        if (!cycleCountId) return res.status(400).json({ error: 'Missing cycleCountId' });
        const result = await applyCycleCountAdjustment(cycleCountId, tenantId, { quantityCounted, expectedQuantity, countedBy, reason });
        return res.status(201).json({ success: true, data: result });
      }
      const record = await createCycleCount(tenantId, payload);
      return res.status(201).json({ success: true, data: record, meta: { tenantId } });
    }

    if (req.method === 'PATCH') {
      const payload = req.body || {};
      const { cycleCountId, state, name, locationId, dueDate } = payload;
      if (!cycleCountId) return res.status(400).json({ error: 'Missing cycleCountId' });
      const updated = await updateCycleCount(cycleCountId, tenantId, { state, name, locationId, dueDate });
      return res.status(200).json({ success: true, data: updated, meta: { tenantId } });
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (err) {
    console.error('[inventory/cycle-counts] error', err?.message || err);
    return res.status(500).json({ success: false, error: err?.message || 'Internal' });
  }
}
