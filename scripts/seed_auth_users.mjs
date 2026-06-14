/**
 * scripts/seed_auth_users.mjs
 * Create demo Firebase Auth users in the target project using the
 * Firebase Admin SDK and the existing `service-account.json` at repo root.
 * Run: node scripts/seed_auth_users.mjs
 */

import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SA_PATH = resolve(__dirname, "../service-account.json");

if (!existsSync(SA_PATH)) {
  console.error("\n❌  service-account.json not found at project root.\n");
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(SA_PATH, "utf8"));

initializeApp({ credential: cert(serviceAccount) });
const auth = getAuth();

const demoUsers = [
  { email: "demo-admin@addiscrown-demo.local", password: "DemoAdmin123!", displayName: "Demo Admin", role: "admin" },
  { email: "demo-worker@addiscrown-demo.local", password: "DemoWorker123!", displayName: "Demo Worker", role: "worker" },
  { email: "demo-viewer@addiscrown-demo.local", password: "DemoViewer123!", displayName: "Demo Viewer", role: "viewer" },
];

async function ensureUser(u) {
  try {
    const existing = await auth.getUserByEmail(u.email).catch(() => null);
    if (existing) {
      console.log(`✅  exists: ${u.email} (uid=${existing.uid})`);
      // ensure custom claims
      await auth.setCustomUserClaims(existing.uid, { tenant: "production", role: u.role });
      return existing.uid;
    }

    const created = await auth.createUser({
      email: u.email,
      emailVerified: true,
      password: u.password,
      displayName: u.displayName,
    });

    await auth.setCustomUserClaims(created.uid, { tenant: "production", role: u.role });
    console.log(`✨  created: ${u.email} (uid=${created.uid})`);
    return created.uid;
  } catch (err) {
    console.error(`❌  ${u.email} — ${err.message}`);
    return null;
  }
}

async function run() {
  console.log("\n🌱  Seeding demo Auth users (tenant=production)...\n");
  for (const u of demoUsers) {
    await ensureUser(u);
  }

  // Optionally list users we touched
  console.log("\nDone. You can sign in with the demo accounts and the passwords above.");
  console.log("Be sure to add the app domain to Firebase Auth authorized domains if you run client flows.");
  process.exit(0);
}

run().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
