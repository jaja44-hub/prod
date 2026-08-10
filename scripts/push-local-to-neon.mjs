#!/usr/bin/env node
/**
 * S7 — Gap-fill push: local → Neon (approved "gap-fill only" strategy).
 *
 * The Neon role DBs are the authoritative schemas (richer + the Odoo main).
 * Local is only the SEED SOURCE for tables/data that Neon is MISSING, so the
 * deployed app's queries all resolve on production.
 *
 * Per-role actions:
 *   main       → CREATE sales_orders, crm_opportunities (if absent); SEED
 *                customers (only if 0 rows), sales_orders, crm_opportunities
 *                from local addiscrown_local. Never touches Odoo tables or the
 *                richer Neon customers/products/etc schemas.
 *   accounting → CREATE vendor_bills, customer_invoices (if absent); SEED them
 *                from local addiscrown_accounting_local.
 *   procurement/analytics/tenantfinance → verify-only (Neon already complete;
 *                tenantfinance has no handler today).
 *
 * Safety:
 *   - idempotent: safe to re-run (only creates-if-absent + seeds if empty).
 *   - --dry-run flag prints intended actions without touching Neon.
 *   - passwords never printed.
 *
 * Usage:
 *   node scripts/push-local-to-neon.mjs            # apply gap-fill
 *   node scripts/push-local-to-neon.mjs --dry-run  # preview only
 *   node scripts/push-local-to-neon.mjs main       # single role
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DRY = process.argv.includes('--dry-run');
const ONLY = process.argv.slice(2).filter((a) => !a.startsWith('--')).map((a) => a.toLowerCase())[0];

function parseEnv(text) {
  const out = {};
  for (const line of text.split('\n')) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (m) out[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
  return out;
}
function readFileOr(file) {
  const p = path.join(ROOT, file);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
}
function labeledUrlsFrom(text) {
  const out = {};
  const lines = text.split('\n');
  let cur = null;
  for (const line of lines) {
    const l = line.match(/db name\s*[-: ]+\s*([A-Za-z0-9_]+)/i);
    if (l) { cur = l[1].toLowerCase(); continue; }
    const u = line.match(/(postgres(?:ql)?:\/\/[^\s"'`]+)/i);
    if (u && cur) { out[cur] = u[1]; cur = null; }
  }
  return out;
}

const labels = labeledUrlsFrom(readFileOr('neon db lists &strings.txt'));
const le = parseEnv(readFileOr('.env.local'));
const neon = {
  main: parseEnv(readFileOr('dev notes/history/DB_CREDENTIALS.md')).DATABASE_URL || parseEnv(readFileOr('.env')).NEON_DATABASE_URL,
  accounting: labels.neon_accounting_db,
  procurement: labels.neon_procurement_db,
  analytics: labels.neon_analytics_db,
  tenantfinance: labels.neon_tenantfinance_db,
};
const localDb = {
  main: 'addiscrown_local',
  accounting: 'addiscrown_accounting_local',
};
function localUrl(db) {
  return `postgresql://${le.LOCAL_PG_USER}:${encodeURIComponent(le.LOCAL_PG_PASSWORD)}@127.0.0.1:5432/${db}`;
}

async function tableExists(client, table) {
  const r = await client.query('SELECT to_regclass($1) AS t', [table]);
  return !!r.rows[0].t;
}
async function rowCount(client, table) {
  const r = await client.query(`SELECT count(*)::int AS n FROM "${table}"`).catch(() => ({ rows: [{ n: -1 }] }));
  return r.rows[0].n;
}

// Copy all rows from local table into the (identical-schema) Neon table.
async function seedRows(localClient, neonClient, table) {
  const data = await localClient.query(`SELECT * FROM "${table}" ORDER BY id`);
  if (!data.rows.length) { console.log(`  ~ ${table}: 0 rows locally, skip`); return 0; }
  const cols = data.fields.map((f) => f.name);
  const colList = cols.map((c) => `"${c}"`).join(', ');
  const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ');
  const sql = `INSERT INTO "${table}" (${colList}) VALUES (${placeholders})`;
  for (const row of data.rows) {
    const values = cols.map((c) => (row[c] === undefined ? null : row[c]));
    await neonClient.query(sql, values);
  }
  console.log(`  ✓ seeded ${table}: ${data.rows.length} rows`);
  return data.rows.length;
}

async function ensureTable(client, createSql) {
  await client.query(`DROP TABLE IF EXISTS __tmp_create_check`);
  await client.query(createSql);
}

async function copyTableSchema(localClient, neonClient, table) {
  // table is a fixed internal name (sales_orders, customers, etc.) — safe to
  // inline as a quoted/verified identifier. PostgreSQL 18 can't infer the type
  // of $1 inside `format(...)::regclass`, so we inline it explicitly.
  const safeTable = /^[a-z0-9_]+$/.test(table) ? table : null;
  if (!safeTable) throw new Error(`Unsafe table name: ${table}`);
  const r = await localClient.query(
    `SELECT column_name, data_type, is_nullable, column_default,
            (SELECT string_agg(pg_get_constraintdef(oid), ' ') FROM pg_constraint c
             WHERE c.conrelid = 'public."${safeTable}"'::regclass AND c.contype = 'p')
     FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position`,
    [table]
  );
  if (r.rows.length === 0) return false;
  const cols = r.rows.map((c) => {
    let t = c.data_type;
    if (c.data_type === 'character varying') t = 'VARCHAR';
    if (c.data_type === 'numeric') t = 'NUMERIC';
    if (c.data_type === 'timestamp without time zone') t = 'TIMESTAMP';
    if (c.data_type === 'text') t = 'TEXT';
    if (c.data_type === 'jsonb') t = 'JSONB';
    if (c.data_type === 'date') t = 'DATE';
    if (c.data_type === 'integer') t = 'INTEGER';
    if (c.data_type === 'boolean') t = 'BOOLEAN';
    let def = c.column_default ? ` DEFAULT ${c.column_default}` : '';
    return `  "${c.column_name}" ${t}${c.is_nullable === 'NO' ? ' NOT NULL' : ''}${def}`;
  });
  let pk = '';
  const pkRow = r.rows.find((c) => c.column_default && /nextval/.test(c.column_default));
  if (pkRow) {
    pk = `,\n  PRIMARY KEY ("${pkRow.column_name}")`;
    // Serial for integer id — drop the nextval default (SERIAL implies it;
    // keeping both would raise "multiple default values").
    const idx = r.rows.indexOf(pkRow);
    const serialized = cols[idx].replace(/^  "id" INTEGER/, '  "id" SERIAL').replace(/DEFAULT nextval\([^)]+\)/, '');
    cols[idx] = serialized;
  }
  const createSql = `CREATE TABLE IF NOT EXISTS "${table}" (\n${cols.join(',\n')}${pk}\n)`;
  if (DRY) { console.log(`  [dry] would CREATE ${table}`); return true; }
  await neonClient.query(createSql);
  // Restore sequence to start beyond max(id) so future inserts don't collide
  await neonClient.query(`SELECT setval(pg_get_serial_sequence('${table}','id'),
    COALESCE((SELECT MAX(id) FROM "${table}"),0)+1, false) WHERE pg_get_serial_sequence('${table}','id') IS NOT NULL`).catch(() => {});
  console.log(`  ✓ created ${table}`);
  return true;
}

async function mainRole() {
  const lc = new pg.Client({ connectionString: localUrl('addiscrown_local') });
  const nc = new pg.Client({ connectionString: neon.main, ssl: { rejectUnauthorized: false } });
  await lc.connect(); await nc.connect();
  console.log(`\n=== main → ${neon.main.match(/@([^/]+)/)[1]} ===`);
  for (const t of ['sales_orders', 'crm_opportunities']) {
    if (!(await tableExists(nc, t))) {
      await copyTableSchema(lc, nc, t);
    } else {
      console.log(`  ~ ${t}: already exists, skip create`);
    }
  }
  // customers: seed ONLY if empty (Neon has richer schema but 0 rows)
  const cust = await rowCount(nc, 'customers');
  if (cust === 0) {
    if (DRY) { console.log('  [dry] would seed customers (0 rows on Neon)'); }
    else {
      // Only copy the columns that exist in BOTH schemas (local subset)
      const lr = await lc.query('SELECT * FROM customers ORDER BY id');
      const common = ['customer_code','name','email','phone','city','country','credit_limit','active','tenant_id','created_at'];
      const csql = `INSERT INTO customers (${common.map((c) => `"${c}"`).join(', ')}) VALUES (${common.map((_, i) => `$${i + 1}`).join(', ')})`;
      for (const row of lr.rows) await nc.query(csql, common.map((c) => row[c] ?? null));
      console.log(`  ✓ seeded customers: ${lr.rows.length} rows (common columns only)`);
    }
  } else {
    console.log(`  ~ customers: already has ${cust} rows, skip`);
  }
  // sales_orders + crm_opportunities data
  for (const t of ['sales_orders', 'crm_opportunities']) {
    const n = await rowCount(nc, t);
    if (n === 0) {
      if (DRY) console.log(`  [dry] would seed ${t}`);
      else await seedRows(lc, nc, t);
    } else {
      console.log(`  ~ ${t}: already has ${n} rows, skip`);
    }
  }
  await lc.end(); await nc.end();
}

async function accountingRole() {
  const lc = new pg.Client({ connectionString: localUrl('addiscrown_accounting_local') });
  const nc = new pg.Client({ connectionString: neon.accounting, ssl: { rejectUnauthorized: false } });
  await lc.connect(); await nc.connect();
  console.log(`\n=== accounting → ${neon.accounting.match(/@([^/]+)/)[1]} ===`);
  for (const t of ['vendor_bills', 'customer_invoices']) {
    if (!(await tableExists(nc, t))) await copyTableSchema(lc, nc, t);
    else console.log(`  ~ ${t}: already exists, skip create`);
    const n = await rowCount(nc, t);
    if (n === 0) {
      if (DRY) console.log(`  [dry] would seed ${t}`);
      else await seedRows(lc, nc, t);
    } else {
      console.log(`  ~ ${t}: already has ${n} rows, skip`);
    }
  }
  await lc.end(); await nc.end();
}

async function verifyRole(role, url) {
  console.log(`\n=== ${role} → ${url.match(/@([^/]+)/)[1]} (verify only) ===`);
  const c = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await c.connect();
  const tables = ['purchase_orders', 'suppliers', 'warehouse_receipts', 'inventory_products', 'inventory_locations', 'inventory_cycle_counts', 'inventory_transactions'];
  for (const t of tables) {
    const n = await rowCount(c, t);
    if (n >= 0) console.log(`  ✓ ${t}: ${n} rows`);
  }
  await c.end();
}

console.log(DRY ? '=== GAP-FILL PUSH (DRY RUN — no changes) ===' : '=== GAP-FILL PUSH (applying) ===');

const roles = ONLY ? [ONLY] : ['main', 'accounting', 'procurement', 'analytics', 'tenantfinance'];
for (const role of roles) {
  if (role === 'main') await mainRole();
  else if (role === 'accounting') await accountingRole();
  else if (role === 'procurement') await verifyRole('procurement', neon.procurement);
  else if (role === 'analytics') await verifyRole('analytics', neon.analytics);
  else if (role === 'tenantfinance') { console.log(`\n=== tenantfinance: no handler consumes it today — verify-only ===`); }
  else console.log(`unknown role: ${role}`);
}
console.log('\n=== done ===');