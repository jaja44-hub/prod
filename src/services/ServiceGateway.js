import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';

let db = null;
let initialized = false;

function ensureInit() {
  if (initialized) return;
  // Frontend expects a Vite env var VITE_FIREBASE_CONFIG containing JSON config
  try {
    if (typeof window !== 'undefined' && import.meta && import.meta.env && import.meta.env.VITE_FIREBASE_CONFIG) {
      const cfg = JSON.parse(import.meta.env.VITE_FIREBASE_CONFIG);
      initializeApp(cfg);
      db = getFirestore();
      initialized = true;
    } else {
      // Not initialized — leave db null. Calls will throw with helpful message.
      console.warn('ServiceGateway: VITE_FIREBASE_CONFIG not set; Firestore calls will fail until configured.');
    }
  } catch (err) {
    console.error('ServiceGateway init error', err);
  }
}

export function tenantQuery(collectionName, ...constraints) {
  ensureInit();
  if (!db) throw new Error('ServiceGateway: Firestore not initialized (VITE_FIREBASE_CONFIG missing)');
  const tenantId = (typeof window !== 'undefined' && window.localStorage && window.localStorage.getItem('tenantId')) || (import.meta.env.VITE_TENANT_ID) || 'production';
  return query(collection(db, collectionName), where('tenant', '==', tenantId), ...constraints);
}

export async function getTenantDoc(collectionName, id) {
  ensureInit();
  // Prefer calling a secure backend for read-by-id when available
  if (typeof window !== 'undefined' && import.meta && import.meta.env && import.meta.env.VITE_BACKEND_URL) {
    const base = import.meta.env.VITE_BACKEND_URL.replace(/\/$/, '');
    const tenantId = (typeof window !== 'undefined' && window.localStorage && window.localStorage.getItem('tenantId')) || (import.meta.env.VITE_TENANT_ID) || 'production';
    const url = `${base}/tenant/${encodeURIComponent(collectionName)}/${encodeURIComponent(id)}?tenant=${encodeURIComponent(tenantId)}`;
    const res = await fetch(url, { method: 'GET', headers: { 'Accept': 'application/json' } });
    if (!res.ok) throw new Error(`getTenantDoc failed: ${res.status} ${res.statusText}`);
    return await res.json();
  }

  if (!db) throw new Error('ServiceGateway: Firestore not initialized and VITE_BACKEND_URL not provided');
  // Fallback: consumer should implement direct Firestore access if necessary
  throw new Error('getTenantDoc is not implemented for direct Firestore in this environment');
}

export async function saveTenantDoc(collectionName, doc) {
  ensureInit();
  // Prefer secure backend write
  if (typeof window !== 'undefined' && import.meta && import.meta.env && import.meta.env.VITE_BACKEND_URL) {
    const base = import.meta.env.VITE_BACKEND_URL.replace(/\/$/, '');
    const tenantId = (typeof window !== 'undefined' && window.localStorage && window.localStorage.getItem('tenantId')) || (import.meta.env.VITE_TENANT_ID) || 'production';
    const url = `${base}/tenant/${encodeURIComponent(collectionName)}`;
    const payload = { tenant: tenantId, doc };
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`saveTenantDoc failed: ${res.status} ${res.statusText}`);
    return await res.json();
  }

  if (!db) throw new Error('ServiceGateway: Firestore not initialized and VITE_BACKEND_URL not provided');
  throw new Error('saveTenantDoc is not implemented for direct Firestore in this environment');
}

export async function updateTenantDoc(collectionName, id, changes) {
  ensureInit();
  // Prefer secure backend update
  if (typeof window !== 'undefined' && import.meta && import.meta.env && import.meta.env.VITE_BACKEND_URL) {
    const base = import.meta.env.VITE_BACKEND_URL.replace(/\/$/, '');
    const tenantId = (typeof window !== 'undefined' && window.localStorage && window.localStorage.getItem('tenantId')) || (import.meta.env.VITE_TENANT_ID) || 'production';
    const url = `${base}/tenant/${encodeURIComponent(collectionName)}/${encodeURIComponent(id)}`;
    const payload = { tenant: tenantId, changes };
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`updateTenantDoc failed: ${res.status} ${res.statusText}`);
    return await res.json();
  }

  if (!db) throw new Error('ServiceGateway: Firestore not initialized and VITE_BACKEND_URL not provided');
  throw new Error('updateTenantDoc is not implemented for direct Firestore in this environment');
}

// Convenience helper: list tenant-scoped documents for a collection.
export async function listTenantCollection(collectionName, ...constraints) {
  ensureInit();
  if (!db) throw new Error('ServiceGateway: Firestore not initialized');
  const q = tenantQuery(collectionName, ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// Lightweight stubs for UI pages during early migration. Replace these with
// production implementations (server APIs or Admin SDK) when ready.
export async function getEmployees() {
  // return empty list to keep UI functional during migration
  return [];
}

export async function getOrders() {
  return [];
}

export default { tenantQuery, getTenantDoc, saveTenantDoc, updateTenantDoc };
