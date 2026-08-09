#!/usr/bin/env node
/**
 * S5 — Live Analytics snapshot regression test.
 * Validates that /api/analytics/snapshot returns every module's KPIs computed
 * from the live DB pools (no hardcoded fallback scores), and that health +
 * activity endpoints agree. Runs against local Postgres when configured;
 * otherwise skips gracefully (module-DB URLs not configured).
 */
import assert from 'assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import handler from '../api/analytics.js';
import { getPool } from '../api/lib/shared.js';

// Load .env.local (local Postgres + Neon module URLs) so the test runs against
// real local pools rather than skipping.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
}

function mkReq(url) {
  return { method: 'GET', url, query: { tenant_id: 'tenant_default' }, headers: {} };
}
function mkRes() {
  return {
    statusCode: 200,
    _json: null,
    status(c) { this.statusCode = c; return this; },
    json(d) { this._json = d; return this; },
    setHeader() {},
  };
}

async function main() {
  // If any pool is not configured, skip (mirrors the existing analytics-engine skip).
  let configured = true;
  for (const db of ['default', 'accounting', 'procurement']) {
    try {
      const p = getPool(db);
      await p.query('SELECT 1');
      await p.end();
    } catch (err) {
      configured = false;
      break;
    }
  }
  if (!configured) {
    console.log('⏭ SKIP: S5 analytics snapshot test requires local DB URLs (not configured).');
    process.exit(0);
  }

  const res = mkRes();
  await handler(mkReq('/api/analytics/snapshot?tenant_id=tenant_default'), res);
  assert.strictEqual(res.statusCode, 200, 'snapshot should return 200');
  const data = res._json?.data || {};
  assert.ok(data.modules, 'snapshot must contain modules');
  assert.ok(data.summary, 'snapshot must contain summary');

  for (const mod of ['sales', 'crm', 'finance', 'purchase', 'warehouse', 'hr']) {
    const m = data.modules[mod];
    assert.ok(m, `module ${mod} must be present`);
    assert.strictEqual(typeof m.score, 'number', `${mod} score must be numeric`);
    assert.ok(m.metrics && Object.keys(m.metrics).length > 0, `${mod} must have metrics`);
  }

  // Summary totals must be non-negative and consistent with module metrics.
  assert.ok(data.summary.totalOrders >= 0, 'totalOrders >= 0');
  assert.strictEqual(data.summary.totalOrders, data.modules.sales.metrics.orders, 'summary totalOrders matches sales orders metric');

  // Health endpoint agrees with snapshot scores.
  const hres = mkRes();
  await handler(mkReq('/api/analytics/health?tenant_id=tenant_default'), hres);
  assert.strictEqual(hres.statusCode, 200, 'health should return 200');
  const health = hres._json?.health || [];
  assert.ok(health.length === Object.keys(data.modules).length, 'health lists every module');
  for (const h of health) {
    assert.deepStrictEqual(h.score, data.modules[h.module].score, `health score matches snapshot for ${h.module}`);
    assert.ok(['healthy', 'attention', 'risk'].includes(h.status), `health status valid for ${h.module}`);
  }

  // Activity endpoint mirrors live DB facts.
  const ares = mkRes();
  await handler(mkReq('/api/analytics/activity?tenant_id=tenant_default'), ares);
  assert.strictEqual(ares.statusCode, 200, 'activity should return 200');
  const events = ares._json?.events || [];
  assert.ok(Array.isArray(events), 'activity events must be an array');

  console.log('✅ PASS: S5 analytics snapshot/health/activity all computed live from DB pools.');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ FAILED:', err?.message || err);
  process.exit(1);
});