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

const legacyEmails = [
  "demo-admin@addiscrown-demo.local",
  "demo-worker@addiscrown-demo.local",
  "demo-viewer@addiscrown-demo.local"
];

async function cleanupLegacyUsers() {
  console.log("🧹 Auditing and cleaning up legacy users...");

  for (const email of legacyEmails) {
    try {
      const user = await auth.getUserByEmail(email);
      console.log(`Deleting legacy user: ${email} (UID: ${user.uid})`);
      
      // Delete from Auth
      await auth.deleteUser(user.uid);
      
      // Delete from Firestore
      await db.collection("users").doc(user.uid).delete();
      await db.collection("users_extended").doc(user.uid).delete();
      
      console.log(`✅ Successfully deleted ${email}`);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        console.log(`ℹ️ Legacy user ${email} already removed or does not exist.`);
      } else {
        console.error(`❌ Error deleting ${email}:`, error);
      }
    }
  }

  console.log("Cleanup complete. RBAC environment standardized.");
  process.exit(0);
}

cleanupLegacyUsers();
