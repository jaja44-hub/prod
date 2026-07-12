import { getFirebaseAdmin } from '../server/api/lib/firebaseAdmin.js';
import { PRODUCTION_SEED_CATALOG } from '../server/api/lib/productionSeedCatalog.js';

async function seedDataset(db, tenantId, datasetKey, seedBuilder) {
  const docId = `${tenantId}__${datasetKey}`;
  const docRef = db.collection('tenant_operational_data').doc(docId);
  
  const seededData = seedBuilder(tenantId);
  await docRef.set(seededData, { merge: true });
  console.log(`✅ Seeded ${datasetKey} for tenant ${tenantId}`);
  return seededData;
}

async function main() {
  try {
    const admin = getFirebaseAdmin();
    if (!admin) {
      console.error('❌ Firebase Admin not initialized. Set FIREBASE_SERVICE_ACCOUNT environment variable.');
      process.exit(1);
    }
    
    const db = admin.firestore();
    const tenantId = 'production';
    
    console.log('🌱 Seeding production operational data to Firestore...');
    console.log(`Tenant: ${tenantId}`);
    console.log(`Collection: tenant_operational_data`);
    console.log('');
    
    const results = {};
    for (const [datasetKey, seedBuilder] of Object.entries(PRODUCTION_SEED_CATALOG)) {
      try {
        const data = await seedDataset(db, tenantId, datasetKey, seedBuilder);
        results[datasetKey] = { success: true, recordCount: data.records?.length || data.picks?.length || data.leads?.length || data.events?.length || 0 };
      } catch (err) {
        console.error(`❌ Failed to seed ${datasetKey}:`, err?.message || err);
        results[datasetKey] = { success: false, error: err?.message || err };
      }
    }
    
    console.log('');
    console.log('📊 Seeding Summary:');
    for (const [key, result] of Object.entries(results)) {
      const status = result.success ? '✅' : '❌';
      const count = result.recordCount || 0;
      console.log(`${status} ${key}: ${result.success ? `${count} records` : result.error}`);
    }
    
    console.log('');
    console.log('✅ Operational data seeding complete.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

main();
