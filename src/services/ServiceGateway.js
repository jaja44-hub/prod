/**
 * Production-sector data layer — Firestore via tenantId scoping (aligned with engineers repo).
 */
import { db } from '../config/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
} from 'firebase/firestore';

let _activeTenantId = null;

export function setActiveTenant(tenantId) {
  _activeTenantId = tenantId || 'production';
}

export function getActiveTenant() {
  if (_activeTenantId) return _activeTenantId;
  if (typeof window !== 'undefined' && window.localStorage?.getItem('tenantId')) {
    return window.localStorage.getItem('tenantId');
  }
  return import.meta.env.VITE_TENANT_ID || 'production';
}

function resolveTenantId() {
  return getActiveTenant();
}

function requireDb() {
  if (!db) {
    throw new Error('ServiceGateway: Firestore not initialized — set VITE_FIREBASE_* on Vercel');
  }
  return db;
}

export function tenantQuery(collectionName, ...constraints) {
  const firestore = requireDb();
  const tenantId = resolveTenantId();
  return query(
    collection(firestore, collectionName),
    where('tenantId', '==', tenantId),
    ...constraints,
  );
}

export async function listTenantCollection(collectionName, ...constraints) {
  const q = tenantQuery(collectionName, ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getTenantDoc(collectionName, id) {
  const firestore = requireDb();
  const tenantId = resolveTenantId();
  const snap = await getDoc(doc(firestore, collectionName, id));
  if (!snap.exists()) return null;
  const data = snap.data();
  if (data.tenantId && data.tenantId !== tenantId) return null;
  return { id: snap.id, ...data };
}

export async function saveTenantDoc(collectionName, payload) {
  const firestore = requireDb();
  const tenantId = resolveTenantId();
  const docData = {
    ...payload,
    tenantId: payload.tenantId || tenantId,
  };
  const ref = await addDoc(collection(firestore, collectionName), docData);
  return { id: ref.id, ...docData };
}

export async function updateTenantDoc(collectionName, id, changes) {
  const firestore = requireDb();
  const tenantId = resolveTenantId();
  await updateDoc(doc(firestore, collectionName, id), {
    ...changes,
    tenantId,
    updatedAt: changes.updatedAt || new Date().toISOString(),
  });
  return { id, ...changes, tenantId };
}

export async function getEmployees() {
  return listTenantCollection('employees');
}

export async function getOrders() {
  return listTenantCollection('orders');
}

export default {
  tenantQuery,
  listTenantCollection,
  getTenantDoc,
  saveTenantDoc,
  updateTenantDoc,
  setActiveTenant,
  getActiveTenant,
};
