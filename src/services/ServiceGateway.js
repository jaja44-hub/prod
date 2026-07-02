/**
 * Production-sector data layer — Firestore via tenantId scoping.
 * Adopted modules (Dashboard analytics, HR, Finance) route through
 * EngineeringGateway for live cross-sector data from ethiobusiness-hub.
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
import { listDocuments, createDocument } from '../lib/firestoreUtils';
export { listDocuments, createDocument };

// ── Engineering Sector Bridge (cross-sector live data) ────────────────────────
import {
  getEngProjects,
  getEngInvoices,
  getEngContracts,
  getEngEmployees,
  getEngAllEmployees,
  getEngPayrollRuns,
  getEngAuditLog,
  getEngOrders,
  getEngFinanceLedger,
  checkEngConnection,
} from './EngineeringGateway';

// Re-export connection checker so components can show live/offline status
export { checkEngConnection };

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
 * getEmployees — routes through Engineering Sector Firestore.
 * Falls back to prod Firestore if engineering is unreachable.
 */
export async function getEmployees() {
  try {
    const eng = await getEngEmployees();
    if (eng && eng.length > 0) return eng;
  } catch { /* fall through */ }
  return listTenantCollection('employees');
}

export async function getOrders() {
  try {
    const eng = await getEngOrders();
    if (eng && eng.length > 0) return eng;
  } catch { /* fall through */ }
  return listTenantCollection('orders');
}

// ============================================================
// 🐘 ODOO ERP ROUTING LAYER (Phase 3.3)
// Routes heavyweight ERP requests to Odoo via the secure
// Vercel Serverless Proxy. Firestore handles real-time/tenant
// data; Odoo handles accounting, inventory, HR, and purchasing.
// ============================================================
import { odooClient } from '../lib/odooClient';

// TICKET-014: Centralized schema-safe query builder
import { buildOdooDomain, sanitizeFields, buildSearchReadKwargs, FIELD_ALLOWLIST, DEFAULT_DOMAINS } from '../lib/odooQuery';

async function executeOdoo(model, method, ...params) {
  try {
    return await odooClient.execute(model, method, ...params);
  } catch (err) {
    const status = err?.response?.status;
    const message = err?.message || '';
    const isColdStart = status === 502 || status === 503 || /timeout/i.test(message) || err?.code === 'ECONNABORTED';
    if (isColdStart) {
      throw new Error(BACKEND_WAKEUP_MESSAGE);
    }
    throw err;
  }
}

export const BACKEND_WAKEUP_MESSAGE = 'The ERP backend is currently waking up. This may take 1-2 minutes. Please retry shortly.';

/**
 * Fetch inventory products from Odoo.
 * @param {number} limit - Max records to return
 * @param {Array} fields - Fields to retrieve
 * @param {object} filters - Optional filters: { active, search, offset, order }
 */
export async function getOdooProducts(limit = 50, fields = null, filters = {}) {
  const domain = buildOdooDomain('product.product', filters);
  const safeFields = fields ? sanitizeFields('product.product', fields) : FIELD_ALLOWLIST['product.product'];
  const kwargs = buildSearchReadKwargs({ fields: safeFields, limit, offset: filters.offset, order: filters.order, model: 'product.product' });
  return executeOdoo('product.product', 'search_read', [domain], kwargs);
}

/**
 * Fetch vendors / suppliers from Odoo.
 * TICKET-014: Uses buildOdooDomain for rank-safe filtering
 */
export async function getOdooVendors(limit = 50, filters = {}) {
  const domain = buildOdooDomain('res.partner', { ...filters, supplier: true });
  const safeFields = FIELD_ALLOWLIST['res.partner'];
  const kwargs = buildSearchReadKwargs({ fields: safeFields, limit, offset: filters.offset, order: filters.order, model: 'res.partner' });
  return executeOdoo('res.partner', 'search_read', [domain], kwargs);
}

/**
 * Fetch customers from Odoo.
 * TICKET-014: Uses buildOdooDomain for rank-safe filtering
 */
export async function getOdooCustomers(limit = 50, filters = {}) {
  const domain = buildOdooDomain('res.partner', { ...filters, customer: true });
  const safeFields = FIELD_ALLOWLIST['res.partner'];
  const kwargs = buildSearchReadKwargs({ fields: safeFields, limit, offset: filters.offset, order: filters.order, model: 'res.partner' });
  return executeOdoo('res.partner', 'search_read', [domain], kwargs);
}

/**
 * Fetch purchase orders from Odoo.
 * TICKET-014: Uses buildOdooDomain and schema-safe fields
 */
export async function getOdooPurchaseOrders(limit = 25, filters = {}) {
  const domain = buildOdooDomain('purchase.order', filters);
  const safeFields = FIELD_ALLOWLIST['purchase.order'];
  const kwargs = buildSearchReadKwargs({ fields: safeFields, limit, offset: filters.offset, order: filters.order, model: 'purchase.order' });
  return executeOdoo('purchase.order', 'search_read', [domain], kwargs);
}

export async function getOdooPurchaseOrder(id) {
  if (!id) throw new Error('Purchase order id is required');
  const orders = await executeOdoo('purchase.order', 'search_read',
    [[['id', '=', Number(id)]]],
    { fields: ['id', 'name', 'partner_id', 'amount_total', 'state', 'date_order', 'origin'], limit: 1 }
  );
  const order = Array.isArray(orders) && orders.length ? orders[0] : null;
  if (!order) return null;
  const lines = await executeOdoo('purchase.order.line', 'search_read',
    [[['order_id', '=', Number(id)]]],
    { fields: ['id', 'product_id', 'product_qty', 'price_unit'], limit: 50 }
  );
  return { ...order, order_lines: Array.isArray(lines) ? lines : [] };
}

export async function createOdooPurchaseOrder({ partner_id, origin, lines = [] }) {
  if (!partner_id) throw new Error('Vendor is required');
  const newId = await executeOdoo('purchase.order', 'create', [{ partner_id: Number(partner_id), origin: origin || '' }]);
  for (const line of lines) {
    await executeOdoo('purchase.order.line', 'create', [{
      order_id: Number(newId),
      product_id: Number(line.product_id),
      product_qty: Number(line.quantity || 0),
      price_unit: Number(line.unitPrice || 0),
    }]);
  }
  return getOdooPurchaseOrder(newId);
}

/**
 * Fetch HR employees from Odoo.
 * TICKET-014: Uses buildOdooDomain and schema-safe fields
 */
export async function getOdooEmployees(limit = 50, filters = {}) {
  const domain = buildOdooDomain('hr.employee', filters);
  const safeFields = FIELD_ALLOWLIST['hr.employee'];
  const kwargs = buildSearchReadKwargs({ fields: safeFields, limit, offset: filters.offset, order: filters.order, model: 'hr.employee' });
  return executeOdoo('hr.employee', 'search_read', [domain], kwargs);
}

/**
 * Fetch the chart of accounts from Odoo.
 * TICKET-014: Uses active field only (deprecated removed per TICKET-013)
 */
export async function getOdooAccounts(limit = 50, filters = {}) {
  const domain = buildOdooDomain('account.account', filters);
  const safeFields = FIELD_ALLOWLIST['account.account'];
  const kwargs = buildSearchReadKwargs({ fields: safeFields, limit, offset: filters.offset, order: filters.order, model: 'account.account' });
  return executeOdoo('account.account', 'search_read', [domain], kwargs);
}

export async function getOdooProduct(id) {
  if (!id) throw new Error('Product id is required');
  const products = await executeOdoo('product.product', 'search_read',
    [[['id', '=', Number(id)]]],
    { fields: ['id', 'name', 'default_code', 'list_price'], limit: 1 }
  );
  return Array.isArray(products) && products.length ? products[0] : null;
}

export async function updateOdooProduct(id, changes) {
  if (!id) throw new Error('Product id is required');
  await executeOdoo('product.product', 'write', [[Number(id)], changes]);
  return getOdooProduct(id);
}

export async function createOdooProduct(payload) {
  if (!payload || !payload.name) {
    throw new Error('Product name is required');
  }
  const newId = await executeOdoo('product.product', 'create', [payload]);
  return getOdooProduct(newId);
}

export async function getOdooManufacturingOrders(limit = 50, filters = {}) {
  // TICKET-014: date_planned_start missing on HF Odoo 19, so strip from requests
  const domain = buildOdooDomain('mrp.production', filters);
  const safeFields = FIELD_ALLOWLIST['mrp.production'];
  const kwargs = buildSearchReadKwargs({ fields: safeFields, limit, offset: filters.offset, order: filters.order, model: 'mrp.production' });
  return executeOdoo('mrp.production', 'search_read', [domain], kwargs);
}

export async function getOdooSalesOrders(limit = 50, filters = {}) {
  // TICKET-014: Uses buildOdooDomain and schema-safe fields
  const domain = buildOdooDomain('sale.order', filters);
  const safeFields = FIELD_ALLOWLIST['sale.order'];
  const kwargs = buildSearchReadKwargs({ fields: safeFields, limit, offset: filters.offset, order: filters.order, model: 'sale.order' });
  return executeOdoo('sale.order', 'search_read', [domain], kwargs);
}

export async function getOdooSalesOrder(id) {
  if (!id) throw new Error('Sales order id is required');
  const orders = await executeOdoo('sale.order', 'search_read',
    [[['id', '=', Number(id)]]],
    { fields: ['id', 'name', 'partner_id', 'amount_total', 'state', 'date_order', 'origin'], limit: 1 }
  );
  const order = Array.isArray(orders) && orders.length ? orders[0] : null;
  if (!order) return null;
  const lines = await executeOdoo('sale.order.line', 'search_read',
    [[['order_id', '=', Number(id)]]],
    { fields: ['id', 'product_id', 'product_uom_qty', 'price_unit'], limit: 50 }
  );
  return { ...order, order_lines: Array.isArray(lines) ? lines : [] };
}

export async function createOdooSalesOrder({ partner_id, origin, lines = [] }) {
  if (!partner_id) throw new Error('Customer is required');
  const newId = await executeOdoo('sale.order', 'create', [{ partner_id: Number(partner_id), origin: origin || '' }]);
  for (const line of lines) {
    await executeOdoo('sale.order.line', 'create', [{
      order_id: Number(newId),
      product_id: Number(line.product_id),
      product_uom_qty: Number(line.quantity || 0),
      price_unit: Number(line.unitPrice || 0),
    }]);
  }
  return getOdooSalesOrder(newId);
}

// ── Adopted module functions — live cross-sector data via EngineeringGateway ──
// Each function first tries Engineering Sector Firestore (ethiobusiness-hub).
// Falls back gracefully to prod Firestore if engineering is unreachable.

export async function getProjects() {
  try {
    const eng = await getEngProjects();
    if (eng && eng.length > 0) return eng;
  } catch { /* fall through */ }
  try { return await listTenantCollection('projects'); } catch { return []; }
}

export async function getInvoices() {
  try {
    const eng = await getEngInvoices();
    if (eng && eng.length > 0) return eng;
  } catch { /* fall through */ }
  try { return await listTenantCollection('invoices'); } catch { return []; }
}

export async function getFinanceLedger() {
  try {
    const eng = await getEngFinanceLedger();
    if (eng && eng.length > 0) return eng;
  } catch { /* fall through */ }
  try { return await listTenantCollection('finance_ledger'); } catch { return []; }
}

export async function getContracts() {
  try {
    const eng = await getEngContracts();
    if (eng && eng.length > 0) return eng;
  } catch { /* fall through */ }
  try { return await listTenantCollection('contracts'); } catch { return []; }
}

export async function getPayrollRuns(limitCount = 8) {
  try {
    const eng = await getEngPayrollRuns(limitCount);
    if (eng && eng.length > 0) return eng;
  } catch { /* fall through */ }
  try {
    const runs = await listTenantCollection('payroll_runs');
    return runs.slice(0, limitCount).sort((a, b) => b.runAt?.localeCompare?.(a.runAt) ?? 0);
  } catch { return []; }
}

export async function getAuditLog(limitCount = 50) {
  try {
    const eng = await getEngAuditLog(limitCount);
    if (eng && eng.length > 0) return eng;
  } catch { /* fall through */ }
  try { return await listTenantCollection('audit_log'); } catch { return []; }
}

// Write functions — always write to prod Firestore (engineering is read-only source)
export async function createEmployee(data) {
  return saveTenantDoc('employees', { ...data, status: 'active', createdAt: new Date().toISOString() });
}

export async function updateEmployee(id, changes) {
  return updateTenantDoc('employees', id, changes);
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
  // Odoo ERP layer
  getOdooProducts,
  getOdooVendors,
  getOdooCustomers,
  getOdooPurchaseOrders,
  getOdooEmployees,
  getOdooAccounts,
  getOdooProduct,
  updateOdooProduct,
  createOdooProduct,
  getOdooManufacturingOrders,
  getOdooSalesOrders,
  getOdooSalesOrder,
  createOdooSalesOrder,
  getOdooPurchaseOrder,
  createOdooPurchaseOrder,
};
