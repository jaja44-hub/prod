/**
 * Extract Demo User Credentials
 * Run: node extract-demo-credentials.mjs
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

async function run() {
  console.log(`\n📋 DEMO USER CREDENTIALS & AUTHENTICATION DATA\n`);
  console.log(`Project: ${serviceAccount.project_id}\n`);

  const snap = await db.collection("users_extended").get();
  const users = [];
  
  snap.forEach((doc) => {
    const data = doc.data();
    users.push({
      uid: doc.id,
      email: data.email || 'N/A',
      password: data.password || 'N/A',
      tier: data.tier,
      tierName: data.tier === 1 ? 'CEO' : data.tier === 2 ? 'Manager' : data.tier === 3 ? 'Staff' : 'User',
      tenantId: data.tenantId || 'N/A',
      displayName: data.displayName || 'N/A',
      createdAt: data.createdAt || 'N/A',
    });
  });

  // Sort by tier (CEO first)
  users.sort((a, b) => a.tier - b.tier);

  console.log("═".repeat(100));
  console.log("DEMO USERS BY TIER");
  console.log("═".repeat(100));

  users.forEach((u) => {
    console.log(`
✉️  EMAIL:        ${u.email}
🔐 PASSWORD:     ${u.password}
👤 NAME:         ${u.displayName}
🎯 TIER:         ${u.tier} (${u.tierName})
🏢 TENANT:       ${u.tenantId}
📍 UID:          ${u.uid}
─────────────────────────────────────────────────────`);
  });

  console.log("\n" + "═".repeat(100));
  console.log("QUICK LOGIN REFERENCE");
  console.log("═".repeat(100));
  
  const ceoUsers = users.filter(u => u.tier === 1);
  const managerUsers = users.filter(u => u.tier === 2);
  const staffUsers = users.filter(u => u.tier === 3);

  if (ceoUsers.length > 0) {
    console.log("\n🔑 CEO LOGIN (Tier 1 - Full Access):");
    console.log(`   Email:    ${ceoUsers[0].email}`);
    console.log(`   Password: ${ceoUsers[0].password}`);
    console.log(`   Tenant:   ${ceoUsers[0].tenantId}`);
  }

  if (managerUsers.length > 0) {
    console.log("\n🔑 MANAGER LOGIN (Tier 2 - Limited Access):");
    console.log(`   Email:    ${managerUsers[0].email}`);
    console.log(`   Password: ${managerUsers[0].password}`);
    console.log(`   Tenant:   ${managerUsers[0].tenantId}`);
  }

  if (staffUsers.length > 0) {
    console.log("\n🔑 STAFF LOGIN (Tier 3 - Minimal Access):");
    console.log(`   Email:    ${staffUsers[0].email}`);
    console.log(`   Password: ${staffUsers[0].password}`);
    console.log(`   Tenant:   ${staffUsers[0].tenantId}`);
  }

  console.log("\n" + "═".repeat(100) + "\n");

  process.exit(0);
}

run().catch((err) => { console.error("Fatal error:", err); process.exit(1); });
