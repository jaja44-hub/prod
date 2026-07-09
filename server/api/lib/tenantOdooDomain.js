// Tenant Odoo Domain helper (TICKET-017)
import fs from 'fs';
import { getFirebaseAdmin } from './firebaseAdmin.js';

// v1 allowlist: only company_id allowed for now across models
export const TENANT_DOMAIN_ALLOWLIST = {
  company_id: ['*'],
};

let _cachedMap = null;
const _firestoreCache = new Map();
const FIRESTORE_CACHE_TTL_MS = 60 * 1000; // 60s

export function loadTenantDomainMap() {
  if (_cachedMap) return _cachedMap;
  const raw = process.env.TENANT_ODOO_DOMAIN_MAP || '';
  if (!raw) {
    _cachedMap = {};
    return _cachedMap;
  }

  try {
    _cachedMap = JSON.parse(raw);
    return _cachedMap;
  } catch (err) {
    console.warn('[tenantOdooDomain] Invalid TENANT_ODOO_DOMAIN_MAP JSON; ignoring. Error:', err.message);
    _cachedMap = {};
    return _cachedMap;
  }
}

function fieldAllowedForModel(field, model) {
  const allowed = TENANT_DOMAIN_ALLOWLIST[field];
  if (!allowed) return false;
  if (allowed.includes('*')) return true;
  return allowed.includes(model);
}

export function getTenantDomainTerms(tenantId, model) {
  const map = loadTenantDomainMap();
  if (!tenantId || !map || typeof map !== 'object') return [];
  const tenantSpec = map[tenantId] || map[tenantId.toString()] || {};
  if (!tenantSpec || typeof tenantSpec !== 'object') return [];

  // per-model override, fallback to default
  const modelTerms = tenantSpec[model] || tenantSpec.default || [];
  if (!Array.isArray(modelTerms)) return [];

  // filter unknown/unsafe fields
  const safe = modelTerms.filter((term) => {
    if (!Array.isArray(term) || term.length < 3) return false;
    const [field] = term;
    return fieldAllowedForModel(field, model);
  });

  return safe;
}

export async function getTenantDomainTermsAsync(tenantId, model) {
  // Try Firestore-backed tenant doc first (TICKET-018). If Firestore not
  // available or doc missing, fall back to env map via getTenantDomainTerms.
  if (!tenantId) return [];

  try {
    const now = Date.now();
    const cached = _firestoreCache.get(tenantId);
    if (cached && now - cached.ts < FIRESTORE_CACHE_TTL_MS) {
      const tenantSpec = cached.val || {};
      const modelTerms = tenantSpec[model] || tenantSpec.default || [];
      return Array.isArray(modelTerms) ? modelTerms.filter((t) => Array.isArray(t) && fieldAllowedForModel(t[0], model)) : [];
    }

    const admin = getFirebaseAdmin();
    const db = admin.firestore();
    const doc = await db.collection('tenants').doc(tenantId).get();
    if (!doc.exists) {
      _firestoreCache.set(tenantId, { ts: now, val: {} });
      return getTenantDomainTerms(tenantId, model);
    }
    const data = doc.data() || {};
    const odooDomain = data.odooDomain || {};
    // Normalize to expected shape
    const tenantSpec = odooDomain || {};
    _firestoreCache.set(tenantId, { ts: now, val: tenantSpec });

    const modelTerms = tenantSpec[model] || tenantSpec.default || [];
    if (!Array.isArray(modelTerms)) return [];
    const safe = modelTerms.filter((term) => {
      if (!Array.isArray(term) || term.length < 3) return false;
      const [field] = term;
      return fieldAllowedForModel(field, model);
    });
    return safe;
  } catch (err) {
    // Firestore not available or misconfigured — fallback to env map
    console.warn('[tenantOdooDomain] Firestore lookup failed, falling back to env map:', err?.message || err);
    return getTenantDomainTerms(tenantId, model);
  }
}

export function mergeOdooDomains(clientDomain, tenantTerms) {
  const client = Array.isArray(clientDomain) ? clientDomain.slice() : [];
  const tenant = Array.isArray(tenantTerms) ? tenantTerms.slice() : [];

  if (tenant.length === 0) return client;

  // Append tenant terms after client terms (AND semantics)
  return client.concat(tenant);
}

export default {
  loadTenantDomainMap,
  getTenantDomainTerms,
  mergeOdooDomains,
};
