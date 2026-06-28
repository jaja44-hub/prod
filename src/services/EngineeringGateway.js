/**
 * EngineeringGateway.js — Cross-Sector Data Bridge
 * ─────────────────────────────────────────────────
 * Connects the Production Sector to the Engineering Sector's Firestore
 * as a READ-ONLY backend data source. This enables adopted UI modules
 * (AnalyticsDashboard, HRFortress, ImperialFinanceMinistry) to pull live
 * data from the engineering org's Firestore database.
 *
 * Architecture:
 *   Production Sector (this app) ──reads──▶ Engineering Sector Firestore
 *                                               (project: ethiobusiness-hub)
 *
 * Env vars needed (set in Vercel + local .env):
 *   VITE_ENG_FIREBASE_API_KEY
 *   VITE_ENG_FIREBASE_AUTH_DOMAIN
 *   VITE_ENG_FIREBASE_PROJECT_ID
 *   VITE_ENG_FIREBASE_APP_ID
 *
 * Security: The engineering Firestore rules allow read access from
 * authenticated contexts. We connect as a secondary Firebase app using
 * the public client config only (no service account exposed to browser).
 */

import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  orderBy,
  limit,
  where,
} from 'firebase/firestore';

// ── Engineering Sector Firebase Config ────────────────────────────────────────
// Reads from VITE_ENG_* env vars set in Vercel and .env.local
// Falls back to hardcoded public config for the engineering project
// (public client config — safe to bundle, no service account used)
const ENG_FIREBASE_CONFIG = {
  apiKey:            import.meta.env.VITE_ENG_FIREBASE_API_KEY            || 'AIzaSyAYmZ_OMI4A1OrxGpu-l0MzsdZkM8Vne5U',
  authDomain:        import.meta.env.VITE_ENG_FIREBASE_AUTH_DOMAIN        || 'ethiobusiness-hub.firebaseapp.com',
  projectId:         import.meta.env.VITE_ENG_FIREBASE_PROJECT_ID         || 'ethiobusiness-hub',
  storageBucket:     import.meta.env.VITE_ENG_FIREBASE_STORAGE_BUCKET     || 'ethiobusiness-hub.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_ENG_FIREBASE_MESSAGING_SENDER_ID || '675337488176',
  appId:             import.meta.env.VITE_ENG_FIREBASE_APP_ID             || '1:675337488176:web:9d592fe13c5265bc1b2af5',
};

// ── Initialize secondary Firebase app (singleton) ─────────────────────────────
const ENG_APP_NAME = 'engineering-sector';

function getEngApp() {
  const existing = getApps().find(a => a.name === ENG_APP_NAME);
  if (existing) return existing;
  return initializeApp(ENG_FIREBASE_CONFIG, ENG_APP_NAME);
}

let _engDb = null;

function getEngDb() {
  if (_engDb) return _engDb;
  try {
    _engDb = getFirestore(getEngApp());
    return _engDb;
  } catch (err) {
    console.error('[EngineeringGateway] Failed to initialize engineering Firestore:', err);
    return null;
  }
}

// ── Helper: safe collection fetch ─────────────────────────────────────────────
async function fetchCollection(collectionName, constraints = []) {
  const db = getEngDb();
  if (!db) return [];
  try {
    const q = constraints.length
      ? query(collection(db, collectionName), ...constraints)
      : query(collection(db, collectionName));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.warn(`[EngineeringGateway] Failed to fetch '${collectionName}':`, err.message);
    return [];
  }
}

async function fetchDoc(collectionName, id) {
  const db = getEngDb();
  if (!db) return null;
  try {
    const snap = await getDoc(doc(db, collectionName, id));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  } catch {
    return null;
  }
}

// ── Connectivity check ────────────────────────────────────────────────────────
export async function checkEngConnection() {
  const db = getEngDb();
  if (!db) return { connected: false, error: 'Failed to initialize engineering Firebase app' };
  try {
    // Light probe — fetch 1 doc from a known collection
    const q = query(collection(db, 'employees'), limit(1));
    await getDocs(q);
    return { connected: true, project: ENG_FIREBASE_CONFIG.projectId };
  } catch (err) {
    return { connected: false, error: err.message };
  }
}

// ── Projects ──────────────────────────────────────────────────────────────────
export async function getEngProjects() {
  return fetchCollection('projects', [orderBy('createdAt', 'desc')]);
}

export async function getEngProject(id) {
  return fetchDoc('projects', id);
}

// ── Invoices / Finance ────────────────────────────────────────────────────────
export async function getEngInvoices() {
  try {
    return fetchCollection('invoices', [orderBy('issuedDate', 'desc')]);
  } catch {
    return fetchCollection('invoices');
  }
}

export async function getEngFinanceLedger() {
  try {
    return fetchCollection('finance_ledger', [orderBy('timestamp', 'desc')]);
  } catch {
    return fetchCollection('finance_ledger');
  }
}

// ── Contracts ─────────────────────────────────────────────────────────────────
export async function getEngContracts() {
  try {
    return fetchCollection('contracts', [orderBy('createdAt', 'desc')]);
  } catch {
    return fetchCollection('contracts');
  }
}

// ── Employees / HR ────────────────────────────────────────────────────────────
export async function getEngEmployees() {
  try {
    return fetchCollection('employees', [where('status', '!=', 'terminated')]);
  } catch {
    return fetchCollection('employees');
  }
}

export async function getEngAllEmployees() {
  return fetchCollection('employees');
}

// ── Payroll ───────────────────────────────────────────────────────────────────
export async function getEngPayrollRuns(limitCount = 8) {
  try {
    return fetchCollection('payroll_runs', [orderBy('runAt', 'desc'), limit(limitCount)]);
  } catch {
    return fetchCollection('payroll_runs');
  }
}

// ── Audit Log ─────────────────────────────────────────────────────────────────
export async function getEngAuditLog(limitCount = 50) {
  try {
    return fetchCollection('audit_log', [orderBy('ts', 'desc'), limit(limitCount)]);
  } catch {
    return fetchCollection('audit_log');
  }
}

// ── Sales / Orders ────────────────────────────────────────────────────────────
export async function getEngOrders() {
  try {
    return fetchCollection('orders', [orderBy('createdAt', 'desc')]);
  } catch {
    return fetchCollection('orders');
  }
}

export async function getEngClients() {
  return fetchCollection('clients');
}

// ── System Logs ───────────────────────────────────────────────────────────────
export async function getEngSystemLogs(limitCount = 30) {
  try {
    return fetchCollection('system_logs', [orderBy('ts', 'desc'), limit(limitCount)]);
  } catch {
    return fetchCollection('system_logs');
  }
}

// ── Default status export (for debug panels) ──────────────────────────────────
export const ENG_PROJECT_ID = ENG_FIREBASE_CONFIG.projectId;
