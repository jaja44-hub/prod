/**
 * Firestore State Verification Script
 * Run: node verify-firestore-state.mjs
 * Purpose: Audit current Firestore state and identify gaps in collections, users, tenants, modules, packages
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

async function auditCollection(collectionName) {
  try {
    const snap = await db.collection(collectionName).limit(100).get();
    console.log(`\n📋 Collection: ${collectionName}`);
    console.log(`   Docs found: ${snap.size}`);
    if (snap.size === 0) {
      console.log(`   ⚠️  EMPTY`);
      return [];
    }
    const docs = [];
    snap.forEach((doc) => {
      docs.push({ id: doc.id, ...doc.data() });
      console.log(`   - ${doc.id}`);
    });
    return docs;
  } catch (err) {
    console.log(`   ❌ Error: ${err.message}`);
    return [];
  }
}

async function run() {
  console.log(`\n🔍 Firestore State Verification for project: ${serviceAccount.project_id}\n`);

  // Audit critical collections
  const users = await auditCollection("users_extended");
  const tenants = await auditCollection("tenants");
  const tenantModules = await auditCollection("tenant_modules");
  const packages = await auditCollection("packages");
  const invItems = await auditCollection("inventory_items");
  const workOrders = await auditCollection("work_orders");

  // Summary Report
  console.log("\n" + "=".repeat(70));
  console.log("AUDIT SUMMARY");
  console.log("=".repeat(70));

  console.log("\n✅ CRITICAL COLLECTIONS STATUS:");
  console.log(`   users_extended:    ${users.length > 0 ? '✅ EXISTS (' + users.length + ' docs)' : '❌ MISSING'}`);
  console.log(`   tenants:           ${tenants.length > 0 ? '✅ EXISTS (' + tenants.length + ' docs)' : '❌ MISSING'}`);
  console.log(`   tenant_modules:    ${tenantModules.length > 0 ? '✅ EXISTS (' + tenantModules.length + ' docs)' : '❌ MISSING'}`);
  console.log(`   packages:          ${packages.length > 0 ? '✅ EXISTS (' + packages.length + ' docs)' : '❌ MISSING'}`);

  console.log("\n🧪 DEMO DATA (Inventory & Work Orders):");
  console.log(`   inventory_items:   ${invItems.length > 0 ? '✅ EXISTS (' + invItems.length + ' docs)' : '❌ MISSING'}`);
  console.log(`   work_orders:       ${workOrders.length > 0 ? '✅ EXISTS (' + workOrders.length + ' docs)' : '❌ MISSING'}`);

  // Detailed issues
  console.log("\n⚠️  GAPS & ISSUES IDENTIFIED:");
  if (users.length === 0) console.log("   - users_extended collection is empty (no demo users with tier/tenantId)");
  if (tenants.length === 0) console.log("   - tenants collection is empty (no tenant definitions)");
  if (tenantModules.length === 0) console.log("   - tenant_modules collection is empty (modules not enabled for tenants)");
  if (packages.length === 0) console.log("   - packages collection is empty (no package tiers defined)");

  if (users.length > 0) {
    console.log("\n📝 User Samples:");
    users.slice(0, 3).forEach((u) => {
      console.log(`   - ${u.id}: tier=${u.tier}, tenantId=${u.tenantId}, email=${u.email || 'N/A'}`);
    });
  }

  if (tenants.length > 0) {
    console.log("\n🏢 Tenant Samples:");
    tenants.slice(0, 3).forEach((t) => {
      console.log(`   - ${t.id}: name=${t.name || 'N/A'}, sector=${t.sector || 'N/A'}`);
    });
  }

  if (tenantModules.length > 0) {
    console.log("\n🔌 Tenant Module Samples:");
    tenantModules.slice(0, 5).forEach((tm) => {
      console.log(`   - tenantId=${tm.tenantId}, moduleId=${tm.moduleId}, enabled=${tm.enabled}`);
    });
  }

  console.log("\n" + "=".repeat(70));
  console.log("NEXT STEPS:");
  console.log("=".repeat(70));
  console.log(`
If gaps exist, seed missing data using:
  1. Create seed extensions for users_extended, tenants, tenant_modules, packages
  2. Run: node seed.js (after updating seed with new collections)
  3. Verify again: node verify-firestore-state.mjs
  `);

  process.exit(0);
}

run().catch((err) => { console.error("Fatal error:", err); process.exit(1); });
