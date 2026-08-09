#!/usr/bin/env node
/**
 * S6.2 — Per-handler auth guard test.
 *
 * Validates the `requireAuth` helper added to `api/lib/shared.js`:
 *   1. GET without a token → OK (legacy read fallback, tenant derived).
 *   2. POST/PUT/DELETE without a token → 401 rejection (mutations protected).
 *   3. A malformed Authorization header → treated as unauthenticated; reads OK, writes 401.
 *   4. No crash when firebase-admin is unavailable (offline runs safe).
 *
 * Note: a REAL Firebase ID token cannot be minted in an offline test; the
 * positive token path is validated by the authenticated browser flows and the
 * deployed smoke tests. Here we prove the fail-closed (mutations) + fail-open
 * (reads) contract is intact and nothing regressed.
 *
 * Usage: node scripts/test_auth_guard.mjs
 */
import { requireAuth, resolveTenantId } from '../api/lib/shared.js';

let passed = 0;
let failed = 0;

function check(name, cond, detail = '') {
  if (cond) {
    passed++;
    console.log(`  ✅ ${name}`);
  } else {
    failed++;
    console.log(`  ❌ ${name} ${detail}`);
  }
}

function makeRes() {
  const calls = [];
  return {
    headersSent: false,
    status(code) { calls.push(['status', code]); return this; },
    json(body) { calls.push(['json', body]); },
    getCalls: () => calls,
  };
}

async function main() {
  console.log('=== S6.2 Auth guard test ===\n');

  // 1. GET without token → legacy read fallback
  {
    const res = makeRes();
    const out = await requireAuth({ method: 'GET', query: { tenant_id: 'tenant_default' }, headers: {} }, res);
    check('GET w/o token returns ok + derived tenant', out.ok === true && out.tenantId === 'tenant_default', JSON.stringify(out));
    check('GET w/o token does NOT write 401', res.getCalls().length === 0);
  }

  // 2. GET with x-tenant-id header
  {
    const res = makeRes();
    const out = await requireAuth({ method: 'GET', query: {}, headers: { 'x-tenant-id': 'tenant_acme' } }, res);
    check('GET uses x-tenant-id header', out.ok === true && out.tenantId === 'tenant_acme');
  }

  // 3. POST without token → 401 (mutation protected)
  {
    const res = makeRes();
    const out = await requireAuth({ method: 'POST', query: {}, headers: {} }, res);
    check('POST w/o token is rejected', out.ok === false);
    const has401 = res.getCalls().some(([kind, code]) => kind === 'status' && code === 401);
    check('POST rejection writes HTTP 401', has401, JSON.stringify(res.getCalls()));
  }

  // 4. PUT without token → 401
  {
    const res = makeRes();
    const out = await requireAuth({ method: 'PUT', query: {}, headers: {} }, res);
    check('PUT w/o token is rejected', out.ok === false);
  }

  // 5. DELETE without token → 401
  {
    const res = makeRes();
    const out = await requireAuth({ method: 'DELETE', query: {}, headers: {} }, res);
    check('DELETE w/o token is rejected', out.ok === false);
  }

  // 6. Malformed Authorization header (not "Bearer") → unauthenticated; read OK
  {
    const res = makeRes();
    const out = await requireAuth({ method: 'GET', query: { tenant_id: 'tenant_beta' }, headers: { authorization: 'Basic abc123' } }, res);
    check('GET with non-Bearer header treated unauthenticated (read OK)', out.ok === true && out.tenantId === 'tenant_beta');
  }

  // 7. Empty Bearer token → unauthenticated; read OK, write 401
  {
    const res = makeRes();
    const out = await requireAuth({ method: 'GET', query: {}, headers: { authorization: 'Bearer   ' } }, res);
    check('GET with empty Bearer token still read-OK', out.ok === true);
    const res2 = makeRes();
    const out2 = await requireAuth({ method: 'POST', query: {}, headers: { authorization: 'Bearer   ' } }, res2);
    check('POST with empty Bearer token rejected 401', out2.ok === false);
  }

  // 8. resolveTenantId still maps 'production' → tenant_default
  {
    const t = resolveTenantId({ query: { tenant_id: 'production' }, headers: {} });
    check('resolveTenantId maps production → tenant_default', t === 'tenant_default');
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
  console.log('✅ Auth guard contract verified.');
}

main().catch((e) => {
  console.error('❌ test error:', e);
  process.exit(1);
});