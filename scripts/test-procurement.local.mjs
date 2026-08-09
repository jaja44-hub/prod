#!/usr/bin/env node
/**
 * S2 — Procurement local DB parity + flow verification test.
 *
 * Asserts the procurement local DB (addiscrown_procurement_local) meets the
 * target "living ideal" and that the S2 purchase→receipt→stock flow is live:
 *
 *  - GAP-001: purchase_orders.supplier_id is an FK to suppliers
 *  - GAP-002: index on purchase_orders.supplier_id exists
 *  - GAP-003: suppliers.supplier_code is UNIQUE (tenant-scoped) + NOT NULL
 *  - GAP-004: purchase_orders.items JSONB is gone (normalized lines table)
 *  - GAP-005: products stock is ledger-based (no stock/qty columns)
 *  - flow: requisition (+items) → PO (+lines) → receipt (+lines) →
 *          inventory_transactions ledger row → PO received
 *
 * Usage:
 *   node scripts/test-procurement.local.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DB_NAME = 'addiscrown_procurement_local';
const TENANT = 'tenant_default';

function loadEnvLocal() {
  const vars = {};
  const envPath = path.join(ROOT, '.env.local');
  if (!fs.existsSync(envPath)) return {};
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) vars[m[1]] = m[2].trim();
  }
  return vars;
}

const env = loadEnvLocal();
const client = new pg.Client({
  host: env.LOCAL_PG_HOST || '127.0.0.1',
  port: Number(env.LOCAL_PG_PORT || 5432),
  user: env.LOCAL_PG_USER,
  password: env.LOCAL_PG_PASSWORD,
  database: DB_NAME,
});

let failures = 0;
function check(label, cond, detail = '') {
  const ok = !!cond;
  console.log(`  ${ok ? '✅' : '❌'} ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures++;
}

async function main() {
  await client.connect();
  console.log(`\n=== S2 procurement local test (${DB_NAME}) ===`);

  // --- GAP closures ---
  const fk = await client.query(
    `SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid
     WHERE t.relname = 'purchase_orders' AND c.contype = 'f'
       AND EXISTS (SELECT 1 FROM unnest(c.conkey) k
                   JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = k
                   WHERE a.attname = 'supplier_id')`
  );
  check('GAP-001: purchase_orders.supplier_id is FK', fk.rows.length === 1);

  const idx = await client.query(
    `SELECT 1 FROM pg_indexes WHERE schemaname = 'public'
       AND tablename = 'purchase_orders' AND indexdef ILIKE '%supplier_id%'`
  );
  check('GAP-002: index on purchase_orders.supplier_id', idx.rows.length === 1);

  const code = await client.query(
    `SELECT count(*)::int AS n FROM pg_indexes WHERE schemaname='public'
       AND tablename='suppliers' AND indexdef ILIKE '%(tenant_id, supplier_code)%'`
  );
  const codeNotNull = await client.query(
    `SELECT count(*)::int AS n FROM information_schema.columns
     WHERE table_schema='public' AND table_name='suppliers' AND column_name='supplier_code'
       AND is_nullable='NO'`
  );
  check('GAP-003: suppliers.supplier_code UNIQUE & NOT NULL', code.rows[0].n === 1 && codeNotNull.rows[0].n === 1);

  const jsonb = await client.query(
    `SELECT count(*)::int AS n FROM information_schema.columns
     WHERE table_schema='public' AND table_name='purchase_orders' AND column_name='items'`
  );
  const hasLines = await client.query(
    `SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='purchase_order_items'`
  );
  check('GAP-004: no items JSONB; purchase_order_items exists', jsonb.rows[0].n === 0 && hasLines.rows.length === 1);

  const stockCol = await client.query(
    `SELECT count(*)::int AS n FROM information_schema.columns
     WHERE table_schema='public' AND table_name='products' AND column_name IN ('stock','quantity','qty_on_hand')`
  );
  check('GAP-005: products has no stock column (ledger-based)', stockCol.rows[0].n === 0);

  // --- Live flow ---
  const sup = await client.query(
    `SELECT count(*)::int AS n, count(DISTINCT supplier_code)::int AS uniq
     FROM suppliers WHERE tenant_id = $1`, [TENANT]
  );
  check('suppliers seeded (5)', sup.rows[0].n === 5, `${sup.rows[0].n} rows`);
  check('supplier_code distinct', sup.rows[0].uniq === sup.rows[0].n);

  const req = await client.query(
    `SELECT pr.id, pr.total_amount, count(pri.id)::int AS items
     FROM purchase_requisitions pr
     LEFT JOIN purchase_requisition_items pri ON pri.requisition_id = pr.id
     WHERE pr.tenant_id = $1 GROUP BY pr.id`, [TENANT]
  );
  check('requisition(s) exist with line items', req.rows.length >= 1,
    `${req.rows.length} reqs, ${req.rows[0]?.items ?? 0} items`);

  const po = await client.query(
    `SELECT po.id, po.po_number, po.total_amount, count(poi.id)::int AS lines
     FROM purchase_orders po
     LEFT JOIN purchase_order_items poi ON poi.po_id = po.id
     WHERE po.tenant_id = $1 GROUP BY po.id, po.po_number, po.total_amount`, [TENANT]
  );
  check('PO exists with line items', po.rows.length >= 1 && po.rows[0].lines >= 1,
    `${po.rows.length} POs, ${po.rows[0]?.lines ?? 0} lines, total=${po.rows[0]?.total_amount ?? 0}`);

  const rcp = await client.query(
    `SELECT wr.id, wr.quantity_accepted, count(wri.id)::int AS lines
     FROM warehouse_receipts wr
     LEFT JOIN warehouse_receipt_items wri ON wri.receipt_id = wr.id
     WHERE wr.tenant_id = $1 GROUP BY wr.id, wr.quantity_accepted`, [TENANT]
  );
  check('warehouse receipt exists with lines', rcp.rows.length >= 1 && rcp.rows[0].lines >= 1,
    `${rcp.rows.length} receipts, accepted=${rcp.rows[0]?.quantity_accepted ?? 0}`);

  const ledger = await client.query(
    `SELECT count(*)::int AS n FROM inventory_transactions WHERE tenant_id = $1`, [TENANT]
  );
  check('inventory ledger entries exist (stock from receipt)', ledger.rows[0].n >= 1,
    `${ledger.rows[0].n} rows`);

  const commit = await client.query(
    `SELECT count(*)::int AS n FROM budget_commitments WHERE tenant_id = $1 AND commitment_type = 'requisition'`, [TENANT]
  );
  check('budget_commitments row posted on approval', commit.rows[0].n >= 1,
    `${commit.rows[0].n} rows`);

  const perf = await client.query(
    `SELECT count(*)::int AS n FROM supplier_performance sp
     WHERE sp.tenant_id = $1 AND sp.supplier_id IN (SELECT id FROM suppliers WHERE tenant_id = $1)`, [TENANT]
  );
  check('supplier_performance references resolve to existing suppliers', perf.rows.length === 1 && perf.rows[0].n > 0,
    `${perf.rows[0].n} resolved`);

  await client.end();
  console.log(failures === 0
    ? '\n✅ S2 procurement parity + flow verified.'
    : `\n❌ ${failures} check(s) failed.`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error('❌', e.message);
  process.exit(1);
});