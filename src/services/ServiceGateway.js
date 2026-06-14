import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where } from 'firebase/firestore';

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
  if (!db) throw new Error('ServiceGateway: Firestore not initialized');
  const docRef = collection(db, collectionName);
  // consumer should use Firestore helpers; keep minimal here
  throw new Error('getTenantDoc is a stub — import a production-ready ServiceGateway or implement server API');
}

export async function saveTenantDoc(collectionName, doc) {
  ensureInit();
  if (!db) throw new Error('ServiceGateway: Firestore not initialized');
  throw new Error('saveTenantDoc is a stub — implement server-side write via secure API or Admin SDK');
}

export async function updateTenantDoc(collectionName, id, changes) {
  ensureInit();
  if (!db) throw new Error('ServiceGateway: Firestore not initialized');
  throw new Error('updateTenantDoc is a stub — implement server-side update via secure API or Admin SDK');
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
