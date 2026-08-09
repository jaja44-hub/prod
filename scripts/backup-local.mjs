#!/usr/bin/env node
/**
 * S6.1 — Per-DB backup (titled) for all 5 local databases.
 *
 * Dumps each addiscrown local DB (main, accounting, procurement, analytics,
 * tenantfinance) to a timestamped, titled file under `backups/` using pg_dump.
 * Credentials come ONLY from `.env.local` (LOCAL_PG_*) — no hardcoded secrets.
 *
 * Per-doc rules honored:
 *   - per-DB titled files (one backup per DB, named with DB + timestamp)
 *   - no hardcoded credentials (env only)
 *   - non-destructive (read-only dumps)
 *
 * Usage:
 *   node scripts/backup-local.mjs            # all 5 DBs
 *   node scripts/backup-local.mjs accounting # single DB
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

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

function backupDb(env, { key, name }) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const file = path.join(BACKUP_DIR, `${key}__${name}__${stamp}.dump`);
  fs.mkdirSync(BACKUP_DIR, { recursive: true });

  const args = [
    '-h', env.LOCAL_PG_HOST || '127.0.0.1',
    '-p', String(env.LOCAL_PG_PORT || 5432),
    '-U', env.LOCAL_PG_USER,
    '-Fc',           // custom-format archive (pg_restore-ready)
    '-d', name,
    '-f', file,
  ];
  const pgEnv = { ...process.env, PGPASSWORD: env.LOCAL_PG_PASSWORD };

  console.log(`  ⏱  pg_dump ${name} → ${path.basename(file)}`);
  execFileSync('pg_dump', args, { env: pgEnv, stdio: ['ignore', 'ignore', 'pipe'] });
  const size = fs.statSync(file).size;
  console.log(`  ✓ ${key}: ${name} backed up (${(size / 1024).toFixed(1)} kB)`);
  return { key, name, file, size };
}

function main() {
  const args = process.argv.slice(2);
  const only = args.length ? args[0].toLowerCase() : null;
  const env = loadEnvLocal();
  const targets = only ? DB_LIST.filter((d) => d.key === only) : DB_LIST;
  if (!targets.length) {
    console.error(`Unknown DB "${only}". Valid: ${DB_LIST.map((d) => d.key).join(', ')}`);
    process.exit(1);
  }

  console.log('=== S6.1 Per-DB backup (local Postgres) ===');
  console.log(`Backups dir: ${BACKUP_DIR}\n`);
  const results = [];
  for (const db of targets) {
    try {
      results.push(backupDb(env, db));
    } catch (e) {
      console.error(`  ✗ ${db.key}: ${db.name} FAILED — ${e.message.split('\n')[0]}`);
      if (e.stderr) console.error(String(e.stderr).split('\n')[0]);
    }
  }

  const ok = results.length;
  const fail = targets.length - ok;
  console.log(`\n✅ Backups OK: ${ok}/${targets.length}${fail ? `, FAILED: ${fail}` : ''}`);
  if (ok) console.log(recentFiles(BACKUP_DIR, ok));
  if (fail) process.exit(1);
}

function recentFiles(dir, n) {
  const files = fs.readdirSync(dir)
    .filter((f) => f.endsWith('.dump'))
    .map((f) => ({ f, t: fs.statSync(path.join(dir, f)).mtimeMs }))
    .sort((a, b) => b.t - a.t)
    .slice(0, n);
  return `  latest backups:\n    ${files.map((x) => x.f).join('\n    ')}`;
}

main();