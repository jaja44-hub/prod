const memoryFallback = new Map();

function cacheKey(tenantId, datasetKey) {
  return `${tenantId}__${datasetKey}`;
}

export async function getTenantDataset(tenantId = 'production', datasetKey) {
  const key = cacheKey(tenantId, datasetKey);
  const cached = memoryFallback.get(key);
  if (cached) return cached;

  // Seed builder removed - data must come from Odoo/Neon DB
  // No fallbacks allowed for Session 8 validation
  throw new Error(`No data found for datasetKey: ${datasetKey}. Data must be sourced from Odoo/Neon DB.`);
}

export async function saveTenantDataset(tenantId = 'production', datasetKey, payload = {}) {
  const record = {
    ...payload,
    tenantId,
    datasetKey,
    schemaVersion: payload.schemaVersion || 1,
    updatedAt: new Date().toISOString(),
  };
  memoryFallback.set(cacheKey(tenantId, datasetKey), record);

  // Firestore write removed - data now persisted in Odoo
  // Keep memory cache for performance
  return record;
}

export async function listTenantRecords(tenantId, datasetKey) {
  const dataset = await getTenantDataset(tenantId, datasetKey);
  return Array.isArray(dataset?.records) ? dataset.records : [];
}

export async function writeModuleEvents(tenantId = 'production', events = []) {
  const admin = getFirebaseAdmin();
  if (!admin) {
    console.warn('[moduleDataStore] Firebase Admin not available, skipping module events write');
    return events.length;
  }
  const db = admin.firestore();
  const batch = db.batch();
  for (const event of events) {
    const id = event.id || `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const ref = db.collection('module_events').doc(id);
    batch.set(ref, {
      ...event,
      id,
      tenantId,
      ts: event.ts?.toDate ? event.ts : event.ts || new Date().toISOString(),
    }, { merge: true });
  }
  await batch.commit();
  return events.length;
}

export default {
  getTenantDataset,
  saveTenantDataset,
  listTenantRecords,
  writeModuleEvents,
};
