#!/usr/bin/env node
/**
 * S7 — Neon credential resolver + connectivity probe.
 *
 * Reads the saved credential files (localhost-allowed dev docs), builds the
 * canonical per-DB URL map used by the app (see api/lib/shared.js getPool):
 *   main        -> DATABASE_URL || NEON_DATABASE_URL
 *   accounting  -> NEON_ACCOUNTING_DB_URL  (fallback NEONACCOUNTINGDBURL)
 *   procurement -> NEON_PROCUREMENT_DB_URL
 *   analytics   -> NEON_ANALYTICS_DB_URL
 *   tenantfinance-> NEON_TENANTFINANCE_DB_URL
 *
 * Sources (in priority order): .env, .env.local, server/.env,
 * `neon db lists &strings.txt`, `dev notes/history/DB_CREDENTIALS.md`,
 * NEON_FALLBACK_SETUP.md.
 *
 * Prints ONLY host + dbname + reachability — never the password.
 * Usage: node scripts/resolve-neon-urls.mjs
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

function allUrlsFromText(text) {
  const re = /(postgres(?:ql)?:\/\/[^\s"'`]+)/gi;
  return [...new Set((text.match(re) || []).map((u) => u.replace(/[),;]+$/, '')))];
}

function hostOf(url) {
  try {
    const u = new URL(url);
    return `${u.hostname}${u.port ? ':' + u.port : ''}`;
  } catch {
    const m = url.match(/@([^:/]+)(?::(\d+))?/);
    return m ? `${m[1]}${m[2] ? ':' + m[2] : ''}` : url;
  }
}
function dbOf(url) {
  try {
    const u = new URL(url);
    return u.pathname.slice(1);
  } catch {
    return '?';
  }
}
function redact(url) {
  return url.replace(/(postgres(?:ql)?:\/\/)[^@]+@/, '$1***:***@');
}

const sources = [];
function collect(file, label) {
  const p = path.join(ROOT, file);
  if (!fs.existsSync(p)) return;
  const text = fs.readFileSync(p, 'utf8');
  sources.push({ file, label, text });
}

collect('.env', 'root .env');
collect('.env.local', '.env.local');
collect('server/.env', 'server/.env');
collect('neon db lists &strings.txt', 'neon-db-list');
collect('dev notes/history/DB_CREDENTIALS.md', 'db-credentials-doc');
collect('NEON_FALLBACK_SETUP.md', 'neon-fallback-setup');

// Gather candidate URLs
const urlPool = [];
for (const s of sources) {
  const envs = parseEnv(s.text);
  for (const [k, v] of Object.entries(envs)) {
    if (/DATABASE|POSTGRES|NEON.*DB_URL/i.test(k) && /^postgres/.test(v)) {
      urlPool.push({ key: k, url: v, src: s.file });
    }
  }
  for (const u of allUrlsFromText(s.text)) {
    urlPool.push({ key: '(inline)', url: u, src: s.file });
  }
}

// De-dup by redacted host+db
const seen = new Set();
const unique = [];
for (const item of urlPool) {
  const sig = `${hostOf(item.url)}/${dbOf(item.url)}`;
  if (!seen.has(sig)) {
    seen.add(sig);
    unique.push(item);
  }
}

// Neon hosts that look like the production accounts
const NEON_HOSTS = new Set([
  'ep-solitary-dew-auii1z3j.c-10.us-east-1.aws.neon.tech',
  'ep-red-dust-avdqp1ld.c-11.us-east-1.aws.neon.tech',
  'ep-silent-breeze-auk7is8u.c-10.us-east-1.aws.neon.tech',
  'ep-sparkling-voice-au9j0rv1.c-10.us-east-1.aws.neon.tech',
  'ep-patient-fog-at5jnnt6.c-9.us-east-1.aws.neon.tech',
  'ep-patient-fog-at5jnnt6-pooler.c-9.us-east-1.aws.neon.tech',
  'ep-tiny-bread-avliuv4n.c-11.us-east-1.aws.neon.tech',
]);

console.log('=== Saved Neon URL candidates (host only) ===');
for (const item of unique) {
  if (!/neon\.tech/.test(item.url)) continue;
  console.log(`  ${item.key.padEnd(28)} ${hostOf(item.url).padEnd(52)} db=${dbOf(item.url)}  (${item.src})`);
}

// Candidate main DB URL
function pick(keys) {
  for (const s of sources) {
    if (s.file === '.env.local') continue; // local dev overrides → ignore here
    const envs = parseEnv(s.text);
    for (const k of keys) {
      if (envs[k] && /^postgres/.test(envs[k])) return envs[k];
    }
  }
  return null;
}

// Parse labeled inline URLs from `neon db lists &strings.txt`
// Format: "db name-neon_accounting_db\npostgresql://...@host/neondb"
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

// Neon host → module mapping from the labeled db-list file
const dbList = sources.find((s) => s.label === 'neon-db-list')?.text || '';
const labeled = labeledUrlsFrom(dbList);
const KNOWN = {
  neon_accounting_db: 'accounting',
  neon_procurement_db: 'procurement',
  neon_analytics_db: 'analytics',
  neon_tenantfinance_db: 'tenantfinance',
};
const labelMap = {};
for (const [label, url] of Object.entries(labeled)) {
  const key = KNOWN[label] || (label.includes('account') ? 'accounting' : label.includes('procure') ? 'procurement' : label.includes('analytics') ? 'analytics' : label.includes('tenant') ? 'tenantfinance' : null);
  if (key && !labelMap[key]) labelMap[key] = url;
}

// Build canonical map: prefer real Neon module URLs from db-list; fall back to env picks
const mainUrl = pick(['DATABASE_URL', 'POSTGRES_URL', 'NEON_DATABASE_URL']);
const accountingUrl = labelMap.accounting || pick(['NEON_ACCOUNTING_DB_URL', 'NEONACCOUNTINGDBURL']);
const procurementUrl = labelMap.procurement || pick(['NEON_PROCUREMENT_DB_URL', 'NEONPROCUREMENTDBURL']);
const analyticsUrl = labelMap.analytics || pick(['NEON_ANALYTICS_DB_URL', 'NEONANALYTICSDBURL']);
const tenantfinanceUrl = labelMap.tenantfinance || pick(['NEON_TENANTFINANCE_DB_URL', 'NEONTENANTFINANCEDBURL']);

const map = { main: mainUrl, accounting: accountingUrl, procurement: procurementUrl, analytics: analyticsUrl, tenantfinance: tenantfinanceUrl };

async function probe(name, url) {
  if (!url) {
    console.log(`  ${name.padEnd(14)} NO URL FOUND`);
    return;
  }
  const client = new pg.Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 8000,
  });
  try {
    await client.connect();
    const r = await client.query('SELECT current_database() AS db, CURRENT_USER AS usr, version()');
    console.log(`  ${name.padEnd(14)} ✅ REACHABLE host=${hostOf(url)} db=${r.rows[0].db} user=${r.rows[0].usr}`);
    await client.end();
  } catch (e) {
    console.log(`  ${name.padEnd(14)} ❌ host=${hostOf(url)} ERR=${e.message.split('\n')[0]}`);
  }
}

console.log('\n=== Per-DB Neon connectivity (passwords hidden) ===');
for (const [name, url] of Object.entries(map)) {
  await probe(name, url);
}

console.log('\n=== For the push: resolved URLs (redacted) ===');
for (const [name, url] of Object.entries(map)) {
  console.log(`  ${name.padEnd(14)} ${url ? redact(url) : '(none)'}`);
}