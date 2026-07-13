import { getFirebaseAdmin } from '../server/api/lib/firebaseAdmin.js';

const COLLECTION = 'tenant_operational_data';
const TENANT_ID = 'production';

// Dataset keys to delete (the ones we migrated to Odoo)
const DATASETS = [
  'sales_orders',
  'warehouse_workflow',
  'finance_aging',
  'purchase_data',
  'crm_pipeline',
];

console.log('🔧 Session 4: Firestore Data Cleanup');
console.log('=====================================\n');

async function deleteDataset(datasetKey) {
  const admin = getFirebaseAdmin();
  if (!admin) {
    console.error('❌ Firebase Admin not available');
    return false;
  }

  const db = admin.firestore();
  const docId = `${TENANT_ID}__${datasetKey}`;
  
  try {
    const doc = await db.collection(COLLECTION).doc(docId).get();
    
    if (!doc.exists) {
      console.log(`  ⏭️  Skipping ${datasetKey} (not found)`);
      return true;
    }
    
    await db.collection(COLLECTION).doc(docId).delete();
    console.log(`  ✅ Deleted: ${datasetKey}`);
    return true;
  } catch (error) {
    console.error(`  ❌ Failed to delete ${datasetKey}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('📦 Deleting Firestore operational data...\n');
  
  let deleted = 0;
  let failed = 0;
  
  for (const datasetKey of DATASETS) {
    const success = await deleteDataset(datasetKey);
    if (success) {
      deleted++;
    } else {
      failed++;
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📋 CLEANUP SUMMARY');
  console.log('='.repeat(60));
  console.log(`Deleted: ${deleted}`);
  console.log(`Failed: ${failed}`);
  console.log('='.repeat(60) + '\n');
  
  if (failed === 0) {
    console.log('✅ Firestore cleanup complete\n');
  } else {
    console.log('⚠️  Some datasets failed to delete\n');
  }
}

main();
