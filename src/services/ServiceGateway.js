/**
 * Production data layer — Firestore tenant scoping + tenant metadata/config.
 *
 * This module is intentionally narrow. Operational ERP data (inventory,
 * purchase, sales, finance, HR, analytics) is served from the per-postgres
 * Neon API layer under `api/` (see `src/lib/apiClient.js`). The Odoo routing
 * layer and the cross-sector EngineeringGateway bridge were REMOVED in S1 per
 * the never-bargained invariants (no cross-repo endpoints; per-DB discipline).
 */
import { db } from '../config/firebase.js';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  orderBy,
  limit as fbLimit,
  startAfter as fbStartAfter,
} from 'firebase/firestore';
import { listDocuments, createDocument } from '../lib/firestoreUtils.js';
export { listDocuments, createDocument };

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

/** Tags a data object with the active tenantId for multi-tenant Firestore writes. */
export function withTenantData(data) {
  return { ...data, tenantId: getActiveTenant() };
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

// Basic paginated fetch using createdAt ordering. Returns { items, lastId }
export async function listTenantCollectionPage(collectionName, pageSize = 25, startAfterId = null) {
  const firestore = requireDb();
  const tenantId = resolveTenantId();
  const baseCol = collection(firestore, collectionName);
  let constraints = [where('tenantId', '==', tenantId), orderBy('createdAt', 'desc'), fbLimit(Number(pageSize || 25))];
  if (startAfterId) {
    const startDoc = await getDoc(doc(firestore, collectionName, startAfterId));
    if (startDoc && startDoc.exists()) {
      constraints = [where('tenantId', '==', tenantId), orderBy('createdAt', 'desc'), fbStartAfter(startDoc), fbLimit(Number(pageSize || 25))];
    }
  }
  const q = query(baseCol, ...constraints);
  const snap = await getDocs(q);
  const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const last = snap.docs[snap.docs.length - 1];
  return { items, lastId: last ? last.id : null };
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

/**
 * getEmployees — prod Firestore tenant-scoped employees.
 * (EngineeringGateway fallback removed in S1 — no cross-repo endpoints.)
 */
export async function getEmployees() {
  return listTenantCollection('employees');
}

export async function getOrders() {
  return listTenantCollection('orders');
}

// ── Firestore-backed HR / approvals / payroll / audit (tenant-scoped) ────────

export async function getPayrollRuns(limitCount = 8) {
  try {
    const runs = await listTenantCollection('payroll_runs');
    return runs.slice(0, limitCount).sort((a, b) => b.runAt?.localeCompare?.(a.runAt) ?? 0);
  } catch { return []; }
}

export async function getAuditLog(limitCount = 50) {
  try { return await listTenantCollection('audit_log'); } catch { return []; }
}

// Write functions — tenant-scoped Firestore writes (config/audit metadata only)
export async function createEmployee(data) {
  return saveTenantDoc('employees', { ...data, status: 'active', createdAt: new Date().toISOString() });
}

export async function updateEmployee(id, changes) {
  return updateTenantDoc('employees', id, changes);
}

export async function getApprovals() {
  return listTenantCollection('admin_approvals');
}

export async function createApproval(data) {
  return saveTenantDoc('admin_approvals', { ...data, status: 'pending', createdAt: new Date().toISOString() });
}

export async function updateApproval(id, changes) {
  return updateTenantDoc('admin_approvals', id, changes);
}

export async function savePayrollRun(data) {
  return saveTenantDoc('payroll_runs', { ...data, runAt: new Date().toISOString() });
}

export async function logAuditEvent(data) {
  try { return await saveTenantDoc('audit_log', { ...data, ts: new Date().toISOString() }); }
  catch { /* non-critical — swallow */ }
}

export default {
  // Firestore layer
  tenantQuery,
  listTenantCollection,
  listDocuments,
  createDocument,
  getTenantDoc,
  saveTenantDoc,
  updateTenantDoc,
  setActiveTenant,
  getActiveTenant,
};
