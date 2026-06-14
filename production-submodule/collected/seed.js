/**
 * seed.js — Addis Crown v3 Firestore Seeder (copied for production-submodule)
 * Run: node seed.js
 * This file expects `service-account.json` in the same folder.
 */

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SA_PATH = resolve(__dirname, "service-account.json");

if (!existsSync(SA_PATH)) {
  console.error("");
  console.error("❌  service-account.json not found in production-submodule!");
  console.error("");
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(SA_PATH, "utf8"));

initializeApp({ credential: cert(serviceAccount) });

const db = getFirestore();

const inventory_items = [
  { id: 'SKU-1001', sku: 'SKU-1001', name: 'Aluminum Sheet 2mm', quantity: 120, unit: 'pcs' },
  { id: 'SKU-1002', sku: 'SKU-1002', name: 'Tempered Glass 6mm', quantity: 60, unit: 'pcs' },
];

const work_orders = [
  { id: 'WO-001', reference: 'WO-001', title: 'Produce Window Frames', status: 'in_progress', priority: 'high' },
  { id: 'WO-002', reference: 'WO-002', title: 'Assemble Door Panels', status: 'pending', priority: 'normal' },
];

async function seedCollection(collectionName, data, tenant = 'production') {
  console.log(`\nSeeding ${collectionName} (tenant=${tenant})...`);
  for (const item of data) {
    const { id, ...docData } = item;
    try {
      await db.collection(collectionName).doc(id).set({ ...docData, tenantId: tenant, _ts: new Date() });
      console.log(`  ✅  ${id}`);
    } catch (err) {
      console.error(`  ❌  ${id} — ${err.message}`);
    }
  }
}

async function runSeed() {
  console.log("");
  console.log("🌱  Production submodule — Firestore Seed (Admin SDK)");
  console.log(`    Project: ${serviceAccount.project_id}`);
  console.log("");

  await seedCollection("inventory_items", inventory_items, 'production');
  await seedCollection("work_orders", work_orders, 'production');

  console.log("");
  console.log("🎉  Seeding complete for production-submodule.");
  console.log("");
  process.exit(0);
}

runSeed().catch((err) => { console.error("Fatal seed error:", err); process.exit(1); });
