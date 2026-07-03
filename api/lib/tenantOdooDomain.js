// Tenant Odoo Domain helper (TICKET-017)
import fs from 'fs';

// v1 allowlist: only company_id allowed for now across models
export const TENANT_DOMAIN_ALLOWLIST = {
  company_id: ['*'],
};

let _cachedMap = null;

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
