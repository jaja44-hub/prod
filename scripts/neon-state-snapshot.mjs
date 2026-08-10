#!/usr/bin/env node
/**
 * S7 — Neon state snapshot (tables + row counts per DB).
 * Reads the canonical per-DB URL map (same resolver logic as resolve-neon-urls.mjs).
 * Prints host, table list sizes, row counts. Passwords never printed.
 *
 * Usage: node scripts/neon-state-snapshot.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

function parseEnv(text) {
  const out = {};
  for (const line of text.split('\n')) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (m) out[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
  return out;
}
function labeledUrlsFrom(text) {
  const out = {};
  const lines = text.split('\n');
  let currentLabel = null;
  for (const line of lines) {
    const l = line.match(/db name\s*[-: ]+\s*([A-Za-z0-9_]+)/i);
    if (l) { currentLabel = l[1].toLowerCase(); continue; }
    const u = line.match(/(postgres(?:ql)?:\/\/[^\s"'`]+)/i);
    if (u && currentLabel) { out[currentLabel] = u[1]; currentLabel = null; }
  }
  return out;
}
function readFileOr(file) {
  const p = path.join(ROOT, file);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
}
function pick(keys) {
  for (const file of ['.env', 'neon db lists &strings.txt', 'dev notes/history/DB_CREDENTIALS.md', 'NEON_FALLBACK_SETUP.md']) {
    const envs = parseEnv(readFileOr(file));
    for (const k of keys) if (envs[k] && /^postgres/.test(envs[k])) return envs[k];
  }
  return null;
}

const dbList = readFileOr('neon db lists &strings.txt');
const labeled = labeledUrlsFrom(dbList);
const KNOWN = { neon_accounting_db: 'accounting', neon_procurement_db: 'procurement', neon_analytics_db: 'analytics', neon_tenantfinance_db: 'tenantfinance' };
const labelMap = {};
for (const [label, url] of Object.entries(labeled)) {
  const key = KNOWN[label] || (label.includes('account') ? 'accounting' : label.includes('procure') ? 'procurement' : label.includes('analytics') ? 'analytics' : label.includes('tenant') ? 'tenantfinance' : null);
  if (key && !labelMap[key]) labelMap[key] = url;
}

const map = {
  main: pick(['DATABASE_URL', 'POSTGRES_URL', 'NEON_DATABASE_URL']),
  accounting: labelMap.accounting || pick(['NEON_ACCOUNTING_DB_URL', 'NEONACCOUNTINGDBURL']),
  procurement: labelMap.procurement || pick(['NEON_PROCUREMENT_DB_URL', 'NEONPROCUREMENTDBURL']),
  analytics: labelMap.analytics || pick(['NEON_ANALYTICS_DB_URL', 'NEONANALYTICSDBURL']),
  tenantfinance: labelMap.tenantfinance || pick(['NEON_TENANTFINANCE_DB_URL', 'NEONTENANTFINANCEDBURL']),
};

function hostOf(url) {
  try { return new URL(url).hostname; } catch { return '?'; }
}

async function audit(name, url) {
  if (!url) { console.log(`\n### ${name}: NO URL`); return; }
  const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 8000 });
  try {
    await client.connect();
    const tables = await client.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' ORDER BY table_name`
    );
    console.log(`\n### ${name}  (${hostOf(url)}) — ${tables.rows.length} tables`);
    const byWeight = [];
    for (const t of tables.rows) {
      try {
        const c = await client.query(`SELECT count(*)::int AS n FROM "${t.table_name}"`);
        byWeight.push([t.table_name, c.rows[0].n]);
      } catch { byWeight.push([t.table_name, -1]); }
    }
    byWeight.sort((a, b) => b[1] - a[1]);
    const shown = byWeight.slice(0, 40);
    const cols = Math.max(...shown.map(([n]) => n?.length || 0), 12) + 2;
    for (const [tname, n] of shown) console.log(`  ${String(tname).padEnd(cols)} ${n}`); 
    if (byWeight.length > shown.length) console.log(`  … ${byWeight.length - shown.length} more tables`);
    await client.end();
    return byWeight;
  } catch (e) {
    console.log(`\n### ${name}: ❌ ${e.message.split('\n')[0]}`);
    return null;
  }
}

console.log('=== NEON STATE SNAPSHOT (row counts per table) ===');
const results = {};
for (const [name, url] of Object.entries(map)) results[name] = await audit(name, url);

console.log('\n=== SUMMARY ===');
const summary = {};
for (const [name, rows] of Object.entries(results)) {
  if (!rows) { summary[name] = { tables: 0, rows: 0, reachable: false }; continue; }
  summary[name] = { tables: rows.length, rows: rows.reduce((a, [, n]) => a + Math.max(n, 0), 0), reachable: true };
  console.log(`  ${name.padEnd(14)} tables=${String(summary[name].tables).padEnd(4)} rows=${summary[name].rows}`);
}