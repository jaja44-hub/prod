#!/usr/bin/env node
/**
 * S2.2 / S2.3 — Purchase→Receipt→Stock live-flow regression (LOCAL ONLY).
 *
 * Drives the REAL api/purchase.js handlers with mock req/res, against the
 * per-module local DB (addiscrown_procurement_local), exercising:
 *   requisition create → approve (budget_commitment) → PO create →
 *   receipt create → complete (inventory_transactions + stock) → verify.
 *
 * Run:
 *   node --env-file=.env.local scripts/test-purchase-flow.local.mjs
 *
 * Requires: LOCAL Postgres with addiscrown_procurement_local migrated+seeded
 * (scripts/migrate-procurement.local.mjs, scripts/seed-procurement.local.mjs).
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load local env overrides manually (so this works without --env-file too).
try {
  const env = readFileSync(join(__dirname, '..', '.env.local'), 'utf8');
  for (const line of env.split('\n')) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2];
  }
} catch {
  /* .env.local optional */
}

process.env.NEON_PROCUREMENT_DB_URL =
  process.env.NEON_PROCUREMENT_DB_URL ||
  'postgresql://ja:localdev@127.0.0.1:5432/addiscrown_procurement_local';

const { default: handler } = await import('../api/purchase.js');

const TENANT = 'production'; // maps to tenant_default via resolveTenantId

function call(method, url, body) {
  const req = {
    method,
    url,
    headers: { 'x-tenant-id': TENANT },
    query: {},
    body,
  };
  const res = {};
  return new Promise((resolve) => {
    res.status = (code) => {
      res.__status = code;
      return res;
    };
    res.json = (payload) => {
      res.__body = payload;
      resolve(res);
    };
    res.setHeader = () => {};
    handler(req, res);
  });
}

let failures = 0;
function check(name, cond, detail) {
  const ok = Boolean(cond);
  if (!ok) failures += 1;
  console.log(`${ok ? '✅' : '❌'} ${name}${detail ? ' — ' + detail : ''}`);
}

const results = {};

// ---- 1. Create a purchase requisition with 2 line items -------------------
let r = await call('POST', '/api/purchase/requisitions', {
  requested_by: 'flow-test',
  requested_by_name: 'Flow Test',
  priority: 'high',
  items: [
    { product_id: 1, product_name: 'Steel Sheet Q1', quantity: 10, unit_price: 25000, unit_of_measure: 'TON' },
    { product_id: 2, product_name: 'Cement Bag', quantity: 20, unit_price: 1500, unit_of_measure: 'BAG' },
  ],
});
check('Requisition create returns 201', r.__status === 201, `status=${r.__status}`);
results.req = r.__body?.data;
check('Requisition has id', !!results.req?.id, `id=${results.req?.id}`);

// ---- 2. Approve requisition (posts budget_commitment) -----------------------------
// Attach budget_id to the new requisition first: the seeded budget is id=1.
const pgC = await import('pg');
const { Pool: PoolC } = pgC;
const poolC = new PoolC({ connectionString: process.env.NEON_PROCUREMENT_DB_URL });
if (results.req?.id) {
  await poolC.query(
    `UPDATE purchase_requisitions SET budget_id = 1
     WHERE id = $1 AND tenant_id = 'tenant_default'`,
    [results.req.id]
  );
}
await poolC.end();

if (results.req?.id) {
  r = await call('POST', `/api/purchase/requisitions/${results.req.id}/approve`, {});
  check('Requisition approve → status approved', r.__status === 200 && r.__body?.data?.status === 'approved',
    `status=${r.__body?.data?.status} err=${r.__body?.error || ''}`);
}

// Verify the budget commitment row was posted on approval (S2.5).
const pgB = await import('pg');
const { Pool: PoolB } = pgB;
const poolB = new PoolB({ connectionString: process.env.NEON_PROCUREMENT_DB_URL });
if (results.req?.id) {
  const b = await poolB.query(
    `SELECT committed_amount, status FROM budget_commitments
     WHERE tenant_id = 'tenant_default' AND reference_type = 'purchase_requisition' AND reference_id = $1`,
    [results.req.id]
  );
  check('Budget commitment posted on requisition approve', b.rows.length >= 1 && b.rows[0].status === 'active',
    `rows=${b.rows.length} status=${b.rows[0]?.status} amount=${b.rows[0]?.committed_amount}`);
}
await poolB.end();

// ---- 3. Create a PO against the requisition ---------------------------------------
r = await call('POST', '/api/purchase/orders', {
  supplier_id: 1,
  expected_delivery_date: '2026-08-01',
  notes: 'S2 live flow test PO',
  items: [
    { product_id: 1, product_name: 'Steel Rod Q1', quantity_ordered: 10, unit_price: 25000, unit_of_measure: 'TON' },
  ],
});
check('PO create returns 201', r.__status === 201, `status=${r.__status} err=${r.__body?.error || ''}`);
results.po = r.__body?.data;
check('PO created with id', !!results.po?.id, `id=${results.po?.id} po_number=${results.po?.po_number}`);

// ---- 4. Approve PO ---------------------------------------------------------------------------
if (results.po?.id) {
  r = await call('POST', `/api/purchase/orders/${results.po.id}/approve`, {});
  check('PO approve → status purchase', r.__status === 200 && r.__body?.data?.status === 'purchase',
    `status=${r.__status} → ${r.__body?.data?.status}`);
}

// ---- 5. Create warehouse receipt with a line -------------------------------------------------
if (results.po?.id) {
  r = await call('POST', '/api/purchase/receipts', {
    po_id: results.po.id,
    received_by: 'warehouse',
    received_by_name: 'Wh Test',
    items: [
      { po_item_id: results.po.id, product_id: 1, product_name: 'Steel Rod A', quantity_received: 8, quantity_accepted: 8, unit_cost: 25000, unit_of_measure: 'TON' },
    ],
  });
  check('Receipt create returns 201', r.__status === 201, `status=${r.__status} err=${r.__body?.error || ''}`);
  results.receipt = r.__body?.data;
  check('Receipt created', !!results.receipt?.id, `id=${results.receipt?.id} receipt#=${results.receipt?.receipt_number}`);
}

// ---- 6. Complete receipt → import inventory_transactions --------------------------
if (results.receipt?.id) {
  r = await call('POST', `/api/purchase/receipts/${results.receipt.id}/complete`, {});
  check('Receipt complete → status completed', r.__status === 200 && r.__body?.data?.status === 'completed',
    `status=${r.__body?.data?.status} err=${r.__body?.error || ''}`);
}

// ---- 7. Verify inventory ledger was posted -----------------------------------------
const pg = await import('pg');
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.NEON_PROCUREMENT_DB_URL });
if (results.receipt?.id) {
  const ledger = await pool.query(
    `SELECT count(*)::int AS n FROM inventory_transactions
     WHERE tenant_id = 'tenant_default' AND reference_type = 'warehouse_receipt' AND reference_id = $1`,
    [results.receipt.id]
  );
  check('Stock ledger posted on receipt complete', ledger.rows[0].n >= 1, `entries=${ledger.rows[0].n}`);

  const poStatus = await pool.query(
    `SELECT status FROM purchase_orders WHERE id = $1 AND tenant_id = 'tenant_default'`,
    [results.po.id]
  );
  check('PO marked received after complete', poStatus.rows[0]?.status === 'received',
    `status=${poStatus.rows[0]?.status}`);
}
await pool.end();

console.log(failures === 0 ? '\n🎉 S2 live flow ALL PASS' : `\n💥 ${failures} failures`);
process.exit(failures === 0 ? 0 : 1);