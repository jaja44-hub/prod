import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SA_PATH = resolve(__dirname, "../service-account.json");

if (!existsSync(SA_PATH)) {
  console.error("❌ service-account.json not found at project root.");
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(SA_PATH, "utf8"));

initializeApp({ credential: cert(serviceAccount) });
const auth = getAuth();
const db = getFirestore();

// CEO, Sales Head, Warehouse Head, HR Director
const demoUsers = [
  { email: "ceo@addiscrown.com", password: "Password123!", displayName: "CEO Super Admin", role: "ceo", tier: 1 },
  { email: "ceo@addiscrown.et", password: "Password123!", displayName: "CEO Super Admin", role: "ceo", tier: 1 },
  { email: "sales@addiscrown.com", password: "Password123!", displayName: "Sales Department Head", role: "sales_head", tier: 2 },
  { email: "sales@addiscrown.et", password: "Password123!", displayName: "Sales Department Head", role: "sales_head", tier: 2 },
  { email: "warehouse@addiscrown.com", password: "Password123!", displayName: "Warehouse Store Head", role: "warehouse_head", tier: 2 },
  { email: "warehouse@addiscrown.et", password: "Password123!", displayName: "Warehouse Store Head", role: "warehouse_head", tier: 2 },
  { email: "hr@addiscrown.com", password: "Password123!", displayName: "HR Director", role: "hr_head", tier: 2 },
  { email: "hr@addiscrown.et", password: "Password123!", displayName: "HR Director", role: "hr_head", tier: 2 }
];

async function ensureUser(u) {
  try {
    const existing = await auth.getUserByEmail(u.email).catch(() => null);
    const profile = {
        uid: existing ? existing.uid : null,
        email: u.email,
        name: u.displayName,
        role: u.role,
        tenantId: "production",
        tier: u.tier || 3,
        createdAt: new Date().toISOString(),
    };

    if (existing) {
      console.log(`✅ exists: ${u.email} (uid=${existing.uid})`);
      await auth.setCustomUserClaims(existing.uid, { tenantId: "production", role: u.role });
      await db.collection("users").doc(existing.uid).set(profile, { merge: true });
      return existing.uid;
    }

    const created = await auth.createUser({
      email: u.email,
      emailVerified: true,
      password: u.password,
      displayName: u.displayName,
    });

    profile.uid = created.uid;
    await auth.setCustomUserClaims(created.uid, { tenantId: "production", role: u.role });
    await db.collection("users").doc(created.uid).set(profile);

    console.log(`✨ created: ${u.email} (uid=${created.uid}, role=${u.role})`);
    return created.uid;
  } catch (err) {
    console.error(`❌ ${u.email} — ${err.message}`);
    return null;
  }
}

async function run() {
  console.log("🌱 Seeding RBAC Auth users (tenant=production)...");
  for (const u of demoUsers) {
    await ensureUser(u);
  }
  console.log("Done.");
  process.exit(0);
}

run().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
