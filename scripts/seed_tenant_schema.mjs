import { getFirebaseAdmin } from '../api/lib/firebaseAdmin.js';
import { modulesForPlanTier } from '../src/lib/policy.js';

async function upsertPackages(db) {
  const tiers = [1, 2, 3];
  for (const tier of tiers) {
    const id = tier === 1 ? 'enterprise' : tier === 2 ? 'pro' : 'starter';
    const docRef = db.collection('packages').doc(id);
    const moduleIds = modulesForPlanTier(tier);
    await docRef.set({
      id,
      name: id,
      planTier: tier,
      moduleIds,
      description: `Seeded package ${id}`,
    }, { merge: true });
    console.log('Upserted package', id);
  }
}

async function upsertProductionTenant(db) {
  const id = 'production';
  const docRef = db.collection('tenants').doc(id);
  const now = new Date().toISOString();
  await docRef.set({
    id,
    name: 'Production',
    status: 'active',
    planTier: 1,
    packageId: 'enterprise',
    odooDomain: {},
    createdAt: now,
    updatedAt: now,
  }, { merge: true });
  console.log('Upserted tenant', id);
}

async function upsertTenantModules(db) {
  const tenantId = 'production';
  const modules = modulesForPlanTier(1);
  for (const moduleId of modules) {
    const docId = `${tenantId}_${moduleId}`;
    const docRef = db.collection('tenant_modules').doc(docId);
    await docRef.set({
      tenantId,
      moduleId,
      enabled: true,
      source: 'package',
      enabledAt: new Date().toISOString(),
    }, { merge: true });
    console.log('Upserted tenant_module', docId);
  }
}

async function main() {
  try {
    const admin = getFirebaseAdmin();
    const db = admin.firestore();
    await upsertPackages(db);
    await upsertProductionTenant(db);
    await upsertTenantModules(db);
    console.log('Seeding complete.');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  main();
} else {
  console.log('FIREBASE_SERVICE_ACCOUNT not configured — skipping seed.');
}
