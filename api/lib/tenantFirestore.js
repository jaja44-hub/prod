import { getFirebaseAdmin } from './firebaseAdmin.js';

const _cache = new Map();
const TTL = 60 * 1000;

export async function getTenantDoc(tenantId) {
  if (!tenantId) return null;
  const now = Date.now();
  const cached = _cache.get(tenantId);
  if (cached && now - cached.ts < TTL) return cached.val;

  try {
    const admin = getFirebaseAdmin();
    const db = admin.firestore();
    const snap = await db.collection('tenants').doc(tenantId).get();
    if (!snap.exists) {
      _cache.set(tenantId, { ts: now, val: null });
      return null;
    }
    const val = snap.data();
    _cache.set(tenantId, { ts: now, val });
    return val;
  } catch (err) {
    console.warn('[tenantFirestore] Firestore read failed:', err?.message || err);
    return null;
  }
}

export default { getTenantDoc };
