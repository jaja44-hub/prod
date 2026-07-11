import { getFirebaseAdmin } from './firebaseAdmin.js';

const COLLECTION = 'tenant_operational_data';
const memoryFallback = new Map();

function docId(tenantId, datasetKey) {
  return `${tenantId}__${datasetKey}`;
}

function cacheKey(tenantId, datasetKey) {
  return docId(tenantId, datasetKey);
}

export async function getTenantDataset(tenantId = 'production', datasetKey, seedBuilder) {
  const key = cacheKey(tenantId, datasetKey);
  const cached = memoryFallback.get(key);
  if (cached) return cached;

  try {
    const admin = getFirebaseAdmin();
    if (!admin) {
      console.warn(`[moduleDataStore] Firebase Admin not available, using seed data for ${datasetKey}`);
    } else {
      const db = admin.firestore();
      const snap = await db.collection(COLLECTION).doc(docId(tenantId, datasetKey)).get();
      if (snap.exists) {
        const data = snap.data();
        if (data && (data.records?.length > 0 || data.picks || data.vendorLines || data.leads || data.events)) {
          memoryFallback.set(key, data);
          return data;
        }
      }
    }
  } catch (err) {
    console.warn(`[moduleDataStore] Firestore read failed for ${datasetKey}:`, err?.message || err);
  }

  const seeded = seedBuilder(tenantId);
  memoryFallback.set(key, seeded);
  try {
    await saveTenantDataset(tenantId, datasetKey, seeded);
  } catch (err) {
    console.warn(`[moduleDataStore] Firestore lazy-seed failed for ${datasetKey}:`, err?.message || err);
  }
  return seeded;
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

  const admin = getFirebaseAdmin();
  if (!admin) {
    console.warn(`[moduleDataStore] Firebase Admin not available, skipping Firestore write for ${datasetKey}`);
    return record;
  }
  const db = admin.firestore();
  await db.collection(COLLECTION).doc(docId(tenantId, datasetKey)).set(record, { merge: true });
  return record;
}

export async function listTenantRecords(tenantId, datasetKey, seedBuilder) {
  const dataset = await getTenantDataset(tenantId, datasetKey, seedBuilder);
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
