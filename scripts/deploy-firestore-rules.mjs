/**
 * Deploy firestore.rules using service-account.json (no Firebase CLI login required).
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { initializeApp, cert } from "firebase-admin/app";
import { getSecurityRules } from "firebase-admin/security-rules";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const saPath = resolve(root, "service-account.json");
const rulesPath = resolve(root, "firestore.rules");

if (!existsSync(saPath)) {
  console.error("❌ service-account.json not found at", saPath);
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(saPath, "utf8"));
const rulesContent = readFileSync(rulesPath, "utf8");

initializeApp({
  credential: cert(serviceAccount),
  projectId: serviceAccount.project_id,
});

console.log(`Deploying Firestore rules to project: ${serviceAccount.project_id}`);

const ruleset = await getSecurityRules().releaseFirestoreRulesetFromSource(
  rulesContent,
);

console.log("✅ Firestore rules deployed successfully.");
console.log("   Ruleset:", ruleset.name);
