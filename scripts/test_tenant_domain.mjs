import assert from 'assert';
import { mergeOdooDomains, getTenantDomainTerms } from '../api/lib/tenantOdooDomain.js';

console.log('Running tenant domain tests...');

// Simple merge
const client = [['active', '=', true]];
const tenant = [['company_id', '=', 1]];
const merged = mergeOdooDomains(client, tenant);
assert(Array.isArray(merged), 'merged should be array');
assert(merged.length === 2, 'merged length');
assert(merged.some((t) => t[0] === 'company_id'), 'company_id present');
console.log('✅ PASS: mergeOdooDomains appends tenant terms');

// production tenant with no map should return unchanged
process.env.TENANT_ODOO_DOMAIN_MAP = JSON.stringify({ production: {} });
const prodTerms = getTenantDomainTerms('production', 'product.product');
assert(Array.isArray(prodTerms) && prodTerms.length === 0, 'production returns empty terms');
console.log('✅ PASS: production tenant with empty map returns no terms');

// invalid JSON should not throw
process.env.TENANT_ODOO_DOMAIN_MAP = '{ invalid json';
let threw = false;
try {
  const t = getTenantDomainTerms('any', 'product.product');
  // should not throw
} catch (e) {
  threw = true;
}
assert(!threw, 'invalid JSON should not throw');
console.log('✅ PASS: invalid JSON does not throw');

console.log('\nAll tenant domain tests passed.');
process.exit(0);
