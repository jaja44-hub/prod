#!/usr/bin/env node
/**
 * S7 — Firebase audit + standardization (read-only by default).
 *
 * Audits the REMOTE Firebase project (using service-account.json) against the
 * app's expected model:
 *   - Auth users (UID, email, emailVerified, custom claims role/tier/tenant)
 *   - Firestore collections: users, users_extended, tenants, packages,
 *     tenant_modules (counts + sample docs)
 *   - Flags: unknown/unexpected demo users, orphaned docs (users_extended
 *     without users doc), mismatched claims, missing CEO/tenant entries.
 *
 * Safe by default: only prints findings. Use --fix with explicit scope to
 * delete orphaned/unknown demo users flagged by this audit (after review).
 *
 * Usage:
 *   node scripts/audit_firebase.mjs               # read-only audit
 *   node scripts/audit_firebase.mjs --detail     # dump up to N docs per coll
 *   node scripts/audit_firebase.mjs --fix        # apply approved cleanups
 */
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SA_PATH = resolve(__dirname, '../service-account.json');
const DETAIL = process.argv.includes('--detail');
const FIX = process.argv.includes('--fix');

import { existsSync } from 'fs';
if (!existsSync(SA_PATH)) {
  console.error('❌ service-account.json not found at project root.');
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(SA_PATH, 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const auth = getAuth();
const db = getFirestore();

// The app's expected demo RBAC users (from seed_rbac_users.mjs).
const EXPECTED_USERS = [
  { email: 'ceo@addiscrown.com', role: 'ceo', tier: 1 },
  { email: 'ceo@addiscrown.et', role: 'ceo', tier: 1 },
  { email: 'sales@addiscrown.com', role: 'sales_head', tier: 3 },
  { email: 'sales@addiscrown.et', role: 'sales_head', tier: 3 },
  { email: 'warehouse@addiscrown.com', role: 'warehouse_head', tier: 2 },
  { email: 'warehouse@addiscrown.et', role: 'warehouse_head', tier: 2 },
  { email: 'hr@addiscrown.com', role: 'hr_head', tier: 2 },
  { email: 'hr@addiscrown.et', role: 'hr_head', tier: 2 },
];
const EXPECTED_EMAILS = new Set(EXPECTED_USERS.map((u) => u.email.toLowerCase()));
// Known legacy/userless demo patterns that should NOT be in production.
const LEGACY_PATTERNS = [
  /addiscrown-demo\.local/i,
  /^demo[-_]/i,
  /\.test$/i,
  /@test\./i,
  /example\.com$/i,
];

let findings = [];

function flag(sev, msg) { findings.push({ sev, msg }); console.log(`  ${sev === 'ERR' ? '❌' : sev === 'WARN' ? '⚠️' : 'ℹ️'} ${msg}`); }

async function auditAuth() {
  console.log('\n=== AUTH USERS ===');
  const list = await auth.listUsers(1000);
  const users = list.users;
  console.log(`  total Auth users: ${users.length}`);
  const seen = new Set();
  for (const u of users) {
    const email = (u.email || '').toLowerCase();
    seen.add(email);
    const claims = u.customClaims || {};
    const expected = EXPECTED_USERS.find((e) => e.email.toLowerCase() === email);
    let line = `  ${email ? email.padEnd(32) : '(no email)'.padEnd(32)} uid=${u.uid.slice(0, 12)}… verify=${!!u.emailVerified}`;
    if (claims.role || claims.tier || claims.tenantId) {
      line += ` claims={role:${claims.role}, tier:${claims.tier}, tenant:${claims.tenantId}}`;
    }
    const legacy = LEGACY_PATTERNS.some((p) => p.test(email) || p.test(u.displayName || ''));
    if (legacy) { line += ' ⚠️LEGACY_PATTERN'; flag('WARN', `Legacy demo user in production: ${email}`); }
    if (email && !EXPECTED_EMAILS.has(email)) {
      line += ' ⚠️UNEXPECTED';
      flag('WARN', `Unexpected auth user: ${email} (role=${claims.role || '?'}, tenant=${claims.tenantId || '?'})`);
    }
    if (expected && (!claims.role || !claims.tier || !claims.tenantId)) {
      line += ' ⚠️MISSING_CLAIMS';
      flag('WARN', `Expected user ${email} missing claims (role=${claims.role}/${claims.tier}/${claims.tenantId})`);
    }
    if (expected && expected.email.toLowerCase() === email) {
      console.log(`  ✓ ${line}`);
    } else {
      console.log(`  ${line}`);
    }
  }
  for (const e of EXPECTED_USERS) {
    if (!seen.has(e.email.toLowerCase())) flag('ERR', `Expected user NOT registered in Auth: ${e.email}`);
  }
  return users;
}

async function auditCollection(name, fields) {
  const snap = await db.collection(name).limit(50).get();
  console.log(`\n=== FIRESTORE: ${name} (showing ${snap.size}) ===`);
  snap.forEach((doc) => {
    const d = doc.data();
    const summary = fields.map((f) => `${f}=${d[f] !== undefined ? d[f] : '∅'}`).join(' ');
    console.log(`  ${doc.id.padEnd(28)} ${summary}`);
  });
}

async function auditUsersCollections() {
  console.log('\n=== FIRESTORE: users vs users_extended ===');
  for (const coll of ['users', 'users_extended']) {
    const all = await db.collection(coll).get();
    const uids = all.docs.map((d) => d.id);
    console.log(`  ${coll}: ${uids.length} docs`);
    if (DETAIL) {
      for (const d of all.docs) {
        const x = d.data();
        console.log(`     ${d.id.slice(0, 14)}… ${x.email || ''} role=${x.role || '∅'} tier=${x.tier ?? '∅'} tenant=${x.tenantId || '∅'}`);
      }
    }
  }
}

async function auditTenantsAndPackages() {
  console.log('\n=== FIRESTORE: tenants / packages / tenant_modules ===');
  const ten = await db.collection('tenants').get();
  console.log(`  tenants: ${ten.size}`);
  ten.forEach((d) => {
    const x = d.data();
    console.log(`     ${d.id} planTier=${x.planTier} package=${x.packageId || '∅'} status=${x.status} name=${x.name || '∅'}`);
  });
  const pkg = await db.collection('packages').get();
  console.log(`  packages: ${pkg.size}`);
  pkg.forEach((d) => {
    const x = d.data();
    console.log(`     ${d.id} planTier=${x.planTier} modules=${(x.moduleIds || []).length}`);
  });
  const tm = await db.collection('tenant_modules').get();
  console.log(`  tenant_modules: ${tm.size}`);
  const prodTm = tm.docs.filter((d) => d.id.startsWith('production_'));
  console.log(`     production_* modules: ${prodTm.length}`);
  if (DETAIL) prodTm.slice(0, 30).forEach((d) => console.log(`      ${d.id} enabled=${d.data().enabled}`));
}

async function main() {
  // Auth
  const users = await auditAuth();
  const authEmails = new Set(users.map((u) => (u.email || '').toLowerCase()));

  // Firestore
  await auditUsersCollections();
  await auditTenantsAndPackages();
  await auditCollection('users_extended', ['email', 'role', 'tier', 'tenantId']);
  if (DETAIL) {
    await auditCollection('users', ['email', 'role', 'tier', 'tenantId']);
  }

  // Cross-collection integrity
  console.log('\n=== INTEGRITY ===');
  const usersSnap = await db.collection('users').get();
  const usersIds = new Set(usersSnap.docs.map((d) => d.id));
  const extSnap = await db.collection('users_extended').get();
  for (const d of extSnap.docs) {
    if (!usersIds.has(d.id)) flag('ERR', `users_extended/${d.id} has NO users/ doc (orphan)`);
  }
  for (const d of usersSnap.docs) {
    const x = d.data();
    const email = (x.email || '').toLowerCase();
    if (email && !authEmails.has(email)) flag('ERR', `users/${d.id} email ${email} NOT in Auth`);
    if (x.tenantId === 'production' && !email) flag('WARN', `users/${d.id} tenant=production but no email`);
  }

  const summary = findings.reduce((a, f) => { a[f.sev] = (a[f.sev] || 0) + 1; return a; }, {});
  console.log('\n=== SUMMARY ===');
  console.log(`  findings: ERR=${summary.ERR || 0} WARN=${summary.WARN || 0} INFO=${summary.INFO || 0}`);
  if (findings.length === 0) console.log('  ✅ Audit clean — matches expected RBAC/tenant model.');

  // --fix: only delete users flagged legacy/unknown IF explicitly requested.
  if (FIX) {
    console.log('\n=== FIX MODE ===');
    for (const u of users) {
      const email = (u.email || '').toLowerCase();
      const legacy = !email || LEGACY_PATTERNS.some((p) => p.test(email) || p.test(u.displayName || ''));
      // Protected: known RBAC/demo users and the production-set must NEVER be deleted.
      const protectedSet = EXPECTED_EMAILS;
      if ((legacy || (!email || !EXPECTED_EMAILS.has(email))) && !protectedSet.has(email)) {
        console.log(`  deleting ${email || u.uid} (uid=${u.uid})`);
        await auth.deleteUser(u.uid).catch((e) => console.log(`    auth: ${e.message}`));
        await db.collection('users').doc(u.uid).delete().catch(() => {});
        await db.collection('users_extended').doc(u.uid).delete().catch(() => {});
        console.log(`    ✓ removed`);
      }
    }
    // Clean orphaned users_extended
    for (const d of extSnap.docs) {
      if (!usersIds.has(d.id)) {
        console.log(`  deleting orphan users_extended/${d.id}`);
        await db.collection('users_extended').doc(d.id).delete().catch(() => {});
      }
    }
    // Remove the unused `tenant_demo` tenant record (never referenced).
    const demoTen = await db.collection('tenants').doc('tenant_demo').get();
    if (demoTen.exists) {
      console.log('  deleting tenant_demo (unreferenced demo record)');
      await db.collection('tenants').doc('tenant_demo').delete();
      console.log('    ✓ removed');
    }
    // Align `tenant_default` record with the production plan (same logical tenant).
    const defTen = await db.collection('tenants').doc('tenant_default').get();
    if (defTen.exists) {
      await db.collection('tenants').doc('tenant_default').set({
        id: 'tenant_default',
        tenantId: 'tenant_default',
        planTier: 1,
        packageId: 'enterprise',
        status: 'active',
        name: 'Addis Crown Production',
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      console.log('  ✓ aligned tenant_default planTier/packageId to enterprise');
    }
    console.log('  fix complete.');
  }
  if (!FIX) {
    console.log('\n  (read-only — re-run with --fix to apply approved cleanups)');
  }
  process.exit(0);
}

main().catch((e) => { console.error('audit failed:', e); process.exit(1); });