import { verifyBearerToken } from '../lib/firebaseAdmin.js';
import { enforceModuleAccess } from '../lib/policyOrchestrator.js';
import { getTenantDomainTermsAsync, mergeOdooDomains } from '../lib/tenantOdooDomain.js';
import odooClient from '../lib/odooClient.js';
import { getTenantDoc } from '../lib/tenantFirestore.js';

const cycleCountStore = new Map();

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

function getTenantCycleCounts(tenantId) {
  return Array.from(cycleCountStore.values()).filter((item) => item.tenantId === tenantId);
}

function getCycleCountById(cycleCountId, tenantId) {
  const record = cycleCountStore.get(cycleCountId);
  if (!record || record.tenantId !== tenantId) return null;
  return record;
}

export function seedCycleCounts(tenantId = 'production') {
  const existing = getTenantCycleCounts(tenantId);
  if (existing.length > 0) return existing;

  const now = Date.now();
  const seeded = [
    {
      cycleCountId: createId('cc'),
      name: 'WH-A Aisle A cycle count',
      locationId: 'WH-A / Aisle A',
      state: 'verified',
      createdAt: new Date(now - 1000 * 60 * 60 * 24 * 2).toISOString(),
      dueDate: new Date(now - 1000 * 60 * 60 * 24).toISOString(),
      expectedQuantities: [{ sku: 'SKU-TEFF-01', qty: 240 }],
      countedBy: 'inventory_lead',
      adjustments: [],
      tenantId,
    },
    {
      cycleCountId: createId('cc'),
      name: 'WH-B bulk storage review',
      locationId: 'WH-B / Bulk',
      state: 'review',
      createdAt: new Date(now - 1000 * 60 * 60 * 12).toISOString(),
      dueDate: new Date(now + 1000 * 60 * 60 * 24).toISOString(),
      expectedQuantities: [{ sku: 'SKU-GRAIN-08', qty: 520 }],
      countedBy: 'warehouse_supervisor',
      adjustments: [],
      tenantId,
    },
    {
      cycleCountId: createId('cc'),
      name: 'WH-A cold chain spot check',
      locationId: 'WH-A / Cold',
      state: 'pending',
      createdAt: new Date(now - 1000 * 60 * 60 * 4).toISOString(),
      dueDate: new Date(now + 1000 * 60 * 60 * 48).toISOString(),
      expectedQuantities: [{ sku: 'SKU-OIL-05', qty: 88 }],
      countedBy: 'cycle_counter_02',
      adjustments: [],
      tenantId,
    },
    {
      cycleCountId: createId('cc'),
      name: 'WH-B pick face variance audit',
      locationId: 'WH-B / Pick Face',
      state: 'adjusted',
      createdAt: new Date(now - 1000 * 60 * 60 * 36).toISOString(),
      dueDate: new Date(now - 1000 * 60 * 60 * 6).toISOString(),
      expectedQuantities: [{ sku: 'SKU-SPICE-12', qty: 64 }],
      countedBy: 'inventory_lead',
      adjustments: [{ adjustmentId: createId('adj'), variance: -2 }],
      tenantId,
    },
  ];

  seeded.forEach((record) => cycleCountStore.set(record.cycleCountId, record));
  return seeded;
}

export async function getCycleCounts(tenantId = 'production') {
  return seedCycleCounts(tenantId);
}
export async function createCycleCount(tenantId, payload = {}) {
  const record = buildCycleCountRecord({ tenantId, ...payload });
  cycleCountStore.set(record.cycleCountId, record);
  return record;
}

export async function updateCycleCount(cycleCountId, tenantId, changes = {}) {
  const existing = getCycleCountById(cycleCountId, tenantId);
  if (!existing) throw new Error('Cycle count not found');
  const updated = { ...existing, ...changes, updatedAt: new Date().toISOString() };
  cycleCountStore.set(cycleCountId, updated);
  return updated;
}

export async function applyCycleCountAdjustment(cycleCountId, tenantId, adjustment = {}) {
  const existing = getCycleCountById(cycleCountId, tenantId);
  if (!existing) throw new Error('Cycle count not found');
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
    adjustments: [...existing.adjustments, adjustmentRecord],
    updatedAt: new Date().toISOString(),
  };
  cycleCountStore.set(cycleCountId, updated);
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
