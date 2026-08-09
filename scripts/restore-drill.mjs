#!/usr/bin/env node
/**
 * S6.1 — Restore drill (verification).
 *
 * Proves the backup pipeline actually restores: takes a fresh pg_dump of ONE
 * local DB, restores it into a throwaway `addiscrown_*_drill` database, compares
 * table counts + total rows against the source, then drops the drill DB.
 *
 * This is the "restore drill" evidence for S6.1 — a backup that cannot be
 * restored is not a backup.
 *
 * Credentials ONLY from `.env.local` (LOCAL_PG_*). No hardcoded secrets.
 * Default target is the `accounting` DB (smallest, fastest) — pass another key
 * to drill a different DB:
 *   node scripts/restore-drill.mjs [main|accounting|procurement|analytics|tenantfinance]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const BACKUP_DIR = path.join(ROOT, 'backups');

const DB_LIST = [
  { key: 'main',         name: 'addiscrown_local' },
  { key: 'accounting',   name: 'addiscrown_accounting_local' },
  { key: 'procurement',  name: 'addiscrown_procurement_local' },
  { key: 'analytics',    name: 'addiscrown_analytics_local' },
  { key: 'tenantfinance', name: 'addiscrown_tenantfinance_local' },
];

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

async function tableStats(client, dbName) {
  const res = await client.query(
    `SELECT count(*)::int AS tables
     FROM information_schema.tables t
     WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`
  );
  const tables = res.rows[0].tables;
  const rowsRes = await client.query(
    `SELECT COALESCE(sum((xpath('/row/c/text()', xml_count))[1]::text::bigint), 0)::bigint AS total
     FROM (
       SELECT query_to_xml('SELECT count(*) AS c FROM "' || tablename || '"', false, true, '') AS xml_count
       FROM pg_tables WHERE schemaname = 'public'
     ) s`
  );
  return { tables, totalRows: Number(rowsRes.rows[0].total || 0), db: dbName };
}

async function main() {
  const arg = process.argv.slice(2)[0] || 'accounting';
  const target = DB_LIST.find((d) => d.key === arg);
  if (!target) {
    console.error(`Unknown DB "${arg}". Valid: ${DB_LIST.map((d) => d.key).join(', ')}`);
    process.exit(1);
  }
  const env = loadEnvLocal();
  const drillDb = `${target.name}_drill`;
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const dumpFile = path.join(BACKUP_DIR, `__drill__${target.name}__${stamp}.dump`);
  fs.mkdirSync(BACKUP_DIR, { recursive: true });

  const host = env.LOCAL_PG_HOST || '127.0.0.1';
  const port = String(env.LOCAL_PG_PORT || 5432);
  const user = env.LOCAL_PG_USER;
  const pgEnv = { ...process.env, PGPASSWORD: env.LOCAL_PG_PASSWORD };
  const baseClient = new pg.Client({ host, port: Number(port), user, password: env.LOCAL_PG_PASSWORD, database: 'postgres' });

  console.log('=== S6.1 Restore drill ===');
  console.log(`Target: ${target.key} → ${target.name}\n`);

  try {
    await baseClient.connect();

    // 1. Snapshot source stats
    const srcClient = new pg.Client({ host, port: Number(port), user, password: env.LOCAL_PG_PASSWORD, database: target.name });
    await srcClient.connect();
    const src = await tableStats(srcClient, target.name);
    console.log(`Source  ${target.name}: ${src.tables} tables, ${src.totalRows} rows`);
    await srcClient.end();

    // 2. pg_dump the source
    console.log('Taking fresh dump…');
    execFileSync('pg_dump', ['-h', host, '-p', port, '-U', user, '-Fc', '-d', target.name, '-f', dumpFile], { env: pgEnv, stdio: ['ignore', 'ignore', 'pipe'] });
    console.log(`Dump written: ${path.basename(dumpFile)} (${(fs.statSync(dumpFile).size / 1024).toFixed(1)} kB)`);

    // 3. Drop any stale drill DB, create fresh, restore
    console.log(`Restoring into drill DB: ${drillDb} …`);
    await baseClient.query(`DROP DATABASE IF EXISTS "${drillDb}"`);
    await baseClient.query(`CREATE DATABASE "${drillDb}"`);
    execFileSync('pg_restore', ['-h', host, '-p', port, '-U', user, '-d', drillDb, '--no-owner', dumpFile], { env: pgEnv, stdio: ['ignore', 'ignore', 'pipe'] });

    // 4. Compare stats
    const drillClient = new pg.Client({ host, port: Number(port), user, password: env.LOCAL_PG_PASSWORD, database: drillDb });
    await drillClient.connect();
    const drill = await tableStats(drillClient, drillDb);
    await drillClient.end();

    const tablesMatch = drill.tables === src.tables;
    const rowsMatch = drill.totalRows === src.totalRows;
    console.log(`Restored ${drillDb}: ${drill.tables} tables, ${drill.totalRows} rows`);
    console.log(`\n  Tables match: ${tablesMatch ? '✅' : '❌'} (${src.tables} vs ${drill.tables})`);
    console.log(`  Rows match:   ${rowsMatch ? '✅' : '❌'} (${src.totalRows} vs ${drill.totalRows})`);

    if (!tablesMatch || !rowsMatch) {
      console.error('\n❌ RESTORE DRILL FAILED — backup is not restorable.');
      process.exit(1);
    }

    console.log('\n✅ RESTORE DRILL PASSED — backup verified restorable.');
  } finally {
    // 5. Cleanup drill DB + temp dump
    await baseClient.query(`DROP DATABASE IF EXISTS "${drillDb}"`).catch(() => {});
    await baseClient.end();
    if (fs.existsSync(dumpFile)) fs.unlinkSync(dumpFile);
    console.log('Cleaned up drill DB + temp dump.');
  }
}

main().catch((e) => {
  console.error('❌ Restore drill error:', e.message);
  process.exit(1);
});