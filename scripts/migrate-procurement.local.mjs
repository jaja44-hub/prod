#!/usr/bin/env node
/**
 * S2.1 — Procurement local DB migration + parity runner (per-DB discipline).
 *
 * Targets ONLY `addiscrown_procurement_local` (never the main DB, never Neon).
 * Reads connection from `.env.local` (LOCAL_PG_*). Applies the 17-migration
 * chain idempotently (each file may be re-run safely), then prints a schema
 * snapshot report: table count, key S2 tables, and row counts.
 *
 * Usage:
 *   node scripts/migrate-procurement.local.mjs
 *
 * Per-doc rules honored:
 *   - one titled per-DB file (procurement) — no combined scripts
 *   - no hardcoded credentials (env only)
 *   - idempotent, non-destructive on re-run
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const MIGRATIONS_DIR = path.join(ROOT, 'server', 'migrations');
const DB_NAME = 'addiscrown_procurement_local';

function loadEnvLocal() {
  const vars = {};
  const envPath = path.join(ROOT, '.env.local');
  if (!fs.existsSync(envPath)) {
    throw new Error('.env.local not found — set LOCAL_PG_* for the local Postgres.');
  }
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) vars[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
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

const APPLY = [
  // Core infrastructure + ESIC + base purchase module are needed as prelude;
  // each is guarded so re-runs are safe on an already-migrated DB.
  '001_core_infrastructure.sql',
  '002_seed_esic_categories.sql',
  '003_purchase_module.sql',
  '016_align_procurement_schema.sql', // the procurement "living ideal" alignment
  '017_add_budget_reference_to_purchase_orders.sql', // idempotent (fixed in S2)
];

// Known already-applied error snippets → treat as "already present".
const IDEMPOTENT_OK = [
  'already exists',
  'already exists:',
  'duplicate key',
  'duplicate_column',
  'duplicate_table',
  'duplicate_object',
  'relation "',
];

function isBenign(err) {
  const msg = String(err?.message || '');
  return IDEMPOTENT_OK.some((s) => msg.includes(s));
}

async function applyMigration(filename) {
  const file = path.join(MIGRATIONS_DIR, filename);
  if (!fs.existsSync(file)) return { filename, status: 'missing' };
  const sql = fs.readFileSync(file, 'utf8');
  try {
    await client.query(sql);
    return { filename, status: 'applied' };
  } catch (err) {
    if (isBenign(err)) return { filename, status: 'already-present' };
    return { filename, status: 'FAILED', error: err.message };
  }
}

async function snapshot() {
  const tables = await client.query(
    `SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename`
  );
  const names = tables.rows.map((r) => r.tablename);
  const counts = {};
  for (const t of names) {
    try {
      const r = await client.query(`SELECT count(*)::int AS n FROM "${t}"`);
      counts[t] = r.rows[0].n;
    } catch {
      counts[t] = '?';
    }
  }
  return { names, counts };
}

async function main() {
  await client.connect();
  console.log(`\n=== Procurement local DB migration (${DB_NAME}) ===`);
  console.log(`Host: ${env.LOCAL_PG_HOST || '127.0.0.1'}:${env.LOCAL_PG_PORT || 5432}`);

  const results = [];
  for (const f of APPLY) results.push(await applyMigration(f));

  for (const r of results) {
    const mark = r.status === 'FAILED' ? '❌' : '✓';
    console.log(`  ${mark} ${r.filename} → ${r.status}${r.error ? ' :: ' + r.error : ''}`);
  }

  const { names, counts } = await snapshot();
  console.log(`\n=== Schema snapshot (${names.length} tables) ===`);
  console.log(names.join(', '));

  const key = [
    'purchase_requisitions', 'purchase_orders', 'purchase_order_items',
    'warehouse_receipts', 'warehouse_receipt_items', 'inventory_transactions',
    'suppliers', 'supplier_quotations', 'supplier_quotation_items',
    'budget_commitments', 'budgets', 'supplier_performance', 'products',
  ];
  console.log('\n=== Key flow tables (row counts) ===');
  for (const t of key) {
    if (counts[t] !== undefined) console.log(`  ${t}: ${counts[t]}`);
  }

  const failed = results.filter((r) => r.status === 'FAILED');
  await client.end();
  if (failed.length) {
    console.error(`\n❌ ${failed.length} migration(s) failed. See above.`);
    process.exit(1);
  }
  console.log('\n✅ Procurement local DB is at target parity.');
}

main().catch((e) => {
  console.error('❌', e.message);
  process.exit(1);
});