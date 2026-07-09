/**
 * Comprehensive Firestore State & Rules Gap Analysis
 * Run: node comprehensive-gap-analysis.mjs
 */

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SA_PATH = resolve(__dirname, "service-account.json");

if (!existsSync(SA_PATH)) {
  console.error("❌ service-account.json not found");
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(SA_PATH, "utf8"));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// Collections that should exist based on our remediation implementation
const EXPECTED_COLLECTIONS = {
  // Critical
  'users_extended': 'User profiles with tier, tenantId',
  'tenants': 'Tenant definitions',
  'tenant_modules': 'Module enablement per tenant',
  'packages': 'Package definitions',

  // Existing (production sector)
  'inventory_items': 'Inventory SKUs',
  'work_orders': 'Manufacturing work orders',
  'purchase_orders': 'Procurement',
  'suppliers': 'Vendor/supplier data',
  'orders': 'Sales orders',
  'sales': 'Sales transactions',

  // NEW from Remediation Rounds 1-7
  'snapshots': 'Inventory valuation snapshots (Round 5)',
  'receipts': 'Purchase receipts (Round 3)',
  'batches': 'Payment batches (Round 5)',
  'audit': 'Audit logs (Round 6)',
  'lot_tracking': 'Lot/serial tracking (Round 6)',
  'cycle_scheduler': 'Cycle count schedules (Round 6)',
  'rfq': 'Request for Quote (Round 3)',
  'commission': 'Sales commission (Round 3)',
  'recurring_orders': 'Recurring order schedules (Round 3)',
  'vendor_performance': 'Vendor metrics (Round 4)',
  'labels': 'Shipping labels (Round 5)',
  'analytics': 'Analytics data (from codebase)',
};

async function checkCollection(name) {
  try {
    const snap = await db.collection(name).limit(1).get();
    return snap.size > 0 ? 'EXISTS' : 'EMPTY';
  } catch (err) {
    if (err.message.includes('PERMISSION_DENIED')) return 'NO_RULES';
    return 'ERROR';
  }
}

async function run() {
  const line = '═'.repeat(100);
  console.log(`\n${line}`);
  console.log('🔍 COMPREHENSIVE FIRESTORE GAP ANALYSIS');
  console.log(`   Project: ${serviceAccount.project_id}`);
  console.log(`${line}\n`);

  console.log('COLLECTIONS STATUS:\n');

  const results = {};
  for (const [name, desc] of Object.entries(EXPECTED_COLLECTIONS)) {
    const status = await checkCollection(name);
    results[name] = status;
    const icon = status === 'EXISTS' ? '✅' : status === 'EMPTY' ? '⚠️ ' : '❌';
    console.log(`${icon} ${name.padEnd(25)} : ${status.padEnd(10)} — ${desc}`);
  }

  // Summary
  const dash = '─'.repeat(100);
  console.log(`\n${dash}`);
  const existing = Object.values(results).filter(s => s === 'EXISTS').length;
  const empty = Object.values(results).filter(s => s === 'EMPTY').length;
  const noRules = Object.values(results).filter(s => s === 'NO_RULES').length;
  const errors = Object.values(results).filter(s => s === 'ERROR').length;

  console.log(`\nSUMMARY:`);
  console.log(`  ✅ EXISTS (has data):        ${existing}/${Object.keys(EXPECTED_COLLECTIONS).length}`);
  console.log(`  ⚠️  EMPTY (no data):         ${empty}`);
  console.log(`  ❌ NO_RULES (permission):   ${noRules}`);
  console.log(`  ⚠️  ERRORS (other):          ${errors}`);

  console.log(`\n${line}`);
  console.log('CRITICAL FINDINGS:\n');

  if (noRules > 0) {
    console.log(`⚠️  ${noRules} collections have NO FIRESTORE RULES defined.`);
    console.log('   These collections are likely blocked by Firestore security rules.');
    console.log('   ACTION: Update firestore.rules to allow access to new collections.\n');
  }

  if (empty > 0) {
    console.log(`⚠️  ${empty} collections exist but are EMPTY.`);
    console.log('   These collections need seed data OR rules need to allow creation.');
    console.log('   ACTION: Seed demo data or verify rules allow writes.\n');
  }

  const missingCollections = Object.entries(results)
    .filter(([, status]) => status !== 'EXISTS' && status !== 'EMPTY')
    .map(([name]) => name);

  if (missingCollections.length > 0) {
    console.log(`❌ MISSING COLLECTIONS (${missingCollections.length}):`);
    missingCollections.forEach(name => {
      console.log(`   - ${name}`);
    });
    console.log('\n   These need to be created in Firestore.');
  }

  console.log(`\n${line}`);
  console.log('REQUIRED ACTIONS:\n');
  console.log('1. UPDATE firestore.rules to include new collections:');
  missingCollections.forEach(name => {
    console.log(`   - ${name}`);
  });
  console.log('\n2. SEED demo data for new collections if needed.');
  console.log('\n3. DEPLOY updated firestore.rules via Firebase CLI or Console.');
  console.log(`\n${line}\n`);

  process.exit(0);
}

run().catch((err) => { console.error("Fatal error:", err); process.exit(1); });
