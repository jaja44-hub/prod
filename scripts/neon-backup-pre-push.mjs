#!/usr/bin/env node
/**
 * S7 — Pre-push safety: snapshot the CURRENT Neon state (all 5 role DBs)
 * into `backups/neon-pre-push/` so nothing is lost before the gap-fill push.
 *
 * Uses pg_dump (custom format) against each role URL resolved from the same
 * sources as resolve-neon-urls.mjs. Passwords are never printed.
 *
 * Usage: node scripts/neon-backup-pre-push.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'backups', 'neon-pre-push');

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
const mainUrl = parseEnv(readFileOr('dev notes/history/DB_CREDENTIALS.md')).DATABASE_URL
  || parseEnv(readFileOr('.env')).NEON_DATABASE_URL;

const map = [
  { key: 'main', url: mainUrl },
  { key: 'accounting', url: labels.neon_accounting_db },
  { key: 'procurement', url: labels.neon_procurement_db },
  { key: 'analytics', url: labels.neon_analytics_db },
  { key: 'tenantfinance', url: labels.neon_tenantfinance_db },
];

fs.mkdirSync(OUT, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

// Pick the newest local pg_dump (Neon servers are PG 18; local PATH may point
// at an older client — using a mismatched major version hard-fails).
function findPgDump() {
  const candidates = [
    '/usr/lib/postgresql/18/bin/pg_dump',
    '/usr/lib/postgresql/17/bin/pg_dump',
    '/usr/bin/pg_dump',
  ];
  for (const p of candidates) {
    try { fs.accessSync(p); return p; } catch { /* next */ }
  }
  return 'pg_dump';
}
const PG_DUMP = findPgDump();

console.log('=== S7 pre-push Neon snapshot ===');
for (const { key, url } of map) {
  if (!url) { console.log(`  ✗ ${key}: no URL`); continue; }
  const file = path.join(OUT, `${key}__pre-push__${stamp}.dump`);
  try {
    execFileSync(PG_DUMP, ['-Fc', '--no-owner', url, '-f', file], { stdio: ['ignore', 'ignore', 'pipe'] });
    console.log(`  ✓ ${key} → ${path.basename(file)} (${(fs.statSync(file).size / 1024).toFixed(1)} kB)`);
  } catch (e) {
    console.log(`  ✗ ${key}: ${String(e.stderr || e).split('\n').slice(-2).join(' ').slice(0, 160)}`);
  }
}