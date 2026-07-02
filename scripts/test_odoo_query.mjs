/**
 * TICKET-014 self-check: Verify odooQuery contract compliance
 *
 * Asserts:
 * - No deprecated field in any domain
 * - date_planned_start stripped from MRP fields
 * - FIELD_ALLOWLIST covers core 4 models
 */

import { buildOdooDomain, sanitizeFields, FIELD_ALLOWLIST, DEFAULT_DOMAINS } from '../src/lib/odooQuery.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    failed++;
  } else {
    console.log(`✅ PASS: ${message}`);
    passed++;
  }
}

console.log('Running TICKET-014 self-checks...\n');

// ─────────────────────────────────────────────────────────────────────────────
// Test 1: account.account never uses deprecated
// ─────────────────────────────────────────────────────────────────────────────

const accountDomain = buildOdooDomain('account.account', {});
const accountDomainStr = JSON.stringify(accountDomain);
assert(
  !accountDomainStr.includes('deprecated'),
  'account.account domain never contains "deprecated"'
);

const accountDomainWithActive = buildOdooDomain('account.account', { active: true });
const accountActiveStr = JSON.stringify(accountDomainWithActive);
assert(
  !accountActiveStr.includes('deprecated'),
  'account.account domain with active filter never contains "deprecated"'
);

// ─────────────────────────────────────────────────────────────────────────────
// Test 2: mrp.production does not expose date_planned_start
// ─────────────────────────────────────────────────────────────────────────────

const mrpAllowed = FIELD_ALLOWLIST['mrp.production'];
assert(
  !mrpAllowed.includes('date_planned_start'),
  'mrp.production FIELD_ALLOWLIST excludes date_planned_start'
);

const mrpSanitized = sanitizeFields('mrp.production', ['id', 'name', 'date_planned_start', 'product_id']);
assert(
  !mrpSanitized.includes('date_planned_start'),
  'sanitizeFields strips date_planned_start from mrp.production'
);

// ─────────────────────────────────────────────────────────────────────────────
// Test 3: Core 4 models have required fields
// ─────────────────────────────────────────────────────────────────────────────

const core4 = ['product.product', 'sale.order', 'purchase.order', 'account.account'];
for (const model of core4) {
  assert(
    FIELD_ALLOWLIST[model] && FIELD_ALLOWLIST[model].length > 0,
    `${model} has FIELD_ALLOWLIST defined`
  );

  assert(
    DEFAULT_DOMAINS[model] !== undefined,
    `${model} has DEFAULT_DOMAINS defined`
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Test 4: buildOdooDomain rejects unknown filters
// ─────────────────────────────────────────────────────────────────────────────

let rejectUnknown = false;
try {
  buildOdooDomain('product.product', { unknown_filter: 'value' });
  rejectUnknown = false;
} catch (e) {
  rejectUnknown = true;
}
assert(rejectUnknown, 'buildOdooDomain rejects unknown filter keys');

// ─────────────────────────────────────────────────────────────────────────────
// Test 5: Search text filters work
// ─────────────────────────────────────────────────────────────────────────────

const productSearch = buildOdooDomain('product.product', { search: 'ABC123' });
const productSearchStr = JSON.stringify(productSearch);
assert(
  productSearchStr.includes('ilike') && productSearchStr.includes('ABC123'),
  'product.product search filter generates ilike domain'
);

// ─────────────────────────────────────────────────────────────────────────────
// Test 6: res.partner rank filters work
// ─────────────────────────────────────────────────────────────────────────────

const vendorDomain = buildOdooDomain('res.partner', { supplier: true });
const vendorStr = JSON.stringify(vendorDomain);
assert(
  vendorStr.includes('supplier_rank') && vendorStr.includes('>'),
  'res.partner supplier filter uses supplier_rank > 0'
);

const customerDomain = buildOdooDomain('res.partner', { customer: true });
const customerStr = JSON.stringify(customerDomain);
assert(
  customerStr.includes('customer_rank') && customerStr.includes('>'),
  'res.partner customer filter uses customer_rank > 0'
);

// ─────────────────────────────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────────────────────────────

console.log(`\n${'─'.repeat(60)}`);
console.log(`Tests passed: ${passed}`);
console.log(`Tests failed: ${failed}`);
console.log(`${'─'.repeat(60)}\n`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log('✅ All TICKET-014 contract checks passed.');
  process.exit(0);
}
