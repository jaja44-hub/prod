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
  orderBy,
  limit as fbLimit,
  startAfter as fbStartAfter,
} from 'firebase/firestore';
export { listDocuments, createDocument } from '../lib/firestoreUtils';

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

export async function getEmployees() {
  return listTenantCollection('employees');
}

export async function getOrders() {
  return listTenantCollection('orders');
}

// ============================================================
// 🐘 ODOO ERP ROUTING LAYER (Phase 3.3)
// Routes heavyweight ERP requests to Odoo via the secure
// Vercel Serverless Proxy. Firestore handles real-time/tenant
// data; Odoo handles accounting, inventory, HR, and purchasing.
// ============================================================
import { odooClient } from '../lib/odooClient';

/**
 * Fetch inventory products from Odoo.
 * @param {number} limit - Max records to return
 * @param {Array} fields - Fields to retrieve
 */
export async function getOdooProducts(limit = 50, fields = ['id', 'name', 'qty_available', 'list_price', 'default_code']) {
  return odooClient.execute('product.product', 'search_read',
    [[['active', '=', true]]],
    { fields, limit }
  );
}

/**
 * Fetch vendors / suppliers from Odoo.
 */
export async function getOdooVendors(limit = 50) {
  return odooClient.execute('res.partner', 'search_read',
    [[['supplier_rank', '>', 0]]],
    { fields: ['id', 'name', 'email', 'phone', 'city'], limit }
  );
}

/**
 * Fetch customers from Odoo.
 */
export async function getOdooCustomers(limit = 50) {
  return odooClient.execute('res.partner', 'search_read',
    [[['customer_rank', '>', 0]]],
    { fields: ['id', 'name', 'email', 'phone', 'city'], limit }
  );
}

/**
 * Fetch purchase orders from Odoo.
 */
export async function getOdooPurchaseOrders(limit = 25) {
  return odooClient.execute('purchase.order', 'search_read',
    [[]],
    { fields: ['id', 'name', 'partner_id', 'date_order', 'amount_total', 'state'], limit }
  );
}

/**
 * Fetch HR employees from Odoo.
 */
export async function getOdooEmployees(limit = 50) {
  return odooClient.execute('hr.employee', 'search_read',
    [[]],
    { fields: ['id', 'name', 'job_title', 'department_id', 'work_email'], limit }
  );
}

/**
 * Fetch the chart of accounts from Odoo.
 */
export async function getOdooAccounts(limit = 50) {
  return odooClient.execute('account.account', 'search_read',
    [[['deprecated', '=', false]]],
    { fields: ['id', 'name', 'code', 'account_type'], limit }
  );
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
  // Odoo ERP layer
  getOdooProducts,
  getOdooVendors,
  getOdooCustomers,
  getOdooPurchaseOrders,
  getOdooEmployees,
  getOdooAccounts,
};
