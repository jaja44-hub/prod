#!/usr/bin/env node
/**
 * S3.0 — Accounting local DB migration + parity runner (per-DB discipline).
 *
 * Targets ONLY `addiscrown_accounting_local` (never the main DB, never Neon).
 * Reads connection from `.env.local` (LOCAL_PG_*). Applies the accounting
 * alignment migration idempotently, then prints a schema snapshot report:
 * table count, the S3 finance tables, and row counts.
 *
 * Usage:
 *   node scripts/migrate-accounting.local.mjs
 *
 * Per-doc rules honored:
 *   - one titled per-DB file (accounting) — no combined scripts
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
const DB_NAME = 'addiscrown_accounting_local';

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
  '018_align_accounting_schema.sql', // the accounting "living ideal" alignment (S3)
  '019_hr_employees_enrichment.sql', // S4 HR employees enrichment (email/department/position/hire_date)
];

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
  console.log(`\n=== Accounting local DB migration (${DB_NAME}) ===`);
  console.log(`Host: ${env.LOCAL_PG_HOST || '127.0.0.1'}:${env.LOCAL_PG_PORT || 5432}`);

  const results = [];
  for (const f of APPLY) results.push(await applyMigration(f));

  for (const r of results) {
    const mark = r.status === 'FAILED' ? '❌' : '✓';
    console.log(`  ${mark} ${r.filename} → ${r.status}${r.error ? ' :: ' + r.error : ''}`);
  }

  const { names, counts } = await snapshot();
  console.log(`\n=== Schema snapshot (${names.length} tables) ===`);
  for (const t of names) {
    console.log(`  - ${t} (${counts[t]} rows)`);
  }

  const required = ['accounts', 'journal_entries', 'journal_entry_lines', 'tax_transactions', 'employees', 'vendor_bills', 'customer_invoices'];
  const missing = required.filter((t) => !names.includes(t));
  const ok = missing.length === 0;
  console.log(`\n${ok ? '✅' : '❌'} S3 required tables: ${missing.length ? 'missing ' + missing.join(', ') : 'all present'}`);
  await client.end();
  process.exit(ok ? 0 : 1);
}

main().catch((e) => {
  console.error('Migration runner failed:', e.message);
  process.exit(1);
});