/**
 * seed-production-data.mjs
 * Production-Grade Firestore Seeding Script
 * Uses productionSeedCatalog to seed all modules with realistic data per Data-Driven ERP Strategy
 * Run: node seed-production-data.mjs
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SA_PATH = resolve(__dirname, 'service-account.json');

if (!existsSync(SA_PATH)) {
  console.error('❌ service-account.json not found');
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(SA_PATH, 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const TENANT = 'production';

// Import seed catalog builders
const {
  buildSalesOrdersSeed,
  buildFinanceAgingSeed,
  buildWarehouseWorkflowSeed,
  buildPurchaseSeed,
  buildCycleCountsSeed,
  buildCrmPipelineSeed,
  buildCrmActivitySeed,
  buildInventoryMovementsSeed,
  buildModuleEventsSeed,
  buildAllProductionSeeds,
} = await import('./server/api/lib/productionSeedCatalog.js');

async function seedDataset(datasetKey, builder) {
  console.log(`\n📦 Seeding ${datasetKey}...`);
  try {
    const dataset = builder(TENANT);
    const docId = `${TENANT}__${datasetKey}`;
    
    await db.collection('tenant_operational_data').doc(docId).set(dataset, { merge: true });
    
    let recordCount = 0;
    if (dataset.records) recordCount = dataset.records.length;
    else if (dataset.picks) recordCount = dataset.picks.length + dataset.packs.length + dataset.shipments.length + dataset.transfers.length;
    else if (dataset.vendorLines) recordCount = dataset.vendorLines.length + dataset.customerLines.length;
    else if (dataset.purchases) recordCount = dataset.purchases.length;
    else if (dataset.leads) recordCount = dataset.leads.length + dataset.opportunities.length;
    else if (dataset.timeline) recordCount = dataset.timeline.length;
    else if (dataset.events) recordCount = dataset.events.length;
    
    console.log(`  ✅ ${datasetKey}: ${recordCount} records seeded`);
    return true;
  } catch (err) {
    console.error(`  ❌ ${datasetKey} failed:`, err?.message || err);
    return false;
  }
}

async function seedModuleEvents() {
  console.log('\n📦 Seeding module_events...');
  try {
    const { events } = buildModuleEventsSeed(TENANT);
    const batch = db.batch();
    
    for (const event of events) {
      const id = event.id || `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const ref = db.collection('module_events').doc(id);
      batch.set(ref, {
        ...event,
        id,
        tenantId: TENANT,
        ts: event.ts?.toDate ? event.ts : event.ts || new Date().toISOString(),
      }, { merge: true });
    }
    
    await batch.commit();
    console.log(`  ✅ module_events: ${events.length} events seeded`);
    return true;
  } catch (err) {
    console.error(`  ❌ module_events failed:`, err?.message || err);
    return false;
  }
}

async function runSeed() {
  console.log('\n' + '═'.repeat(80));
  console.log('🌱 PRODUCTION-GRADE FIRESTORE SEEDING');
  console.log(`   Project: ${serviceAccount.project_id}`);
  console.log(`   Tenant: ${TENANT}`);
  console.log('   Strategy: Data-Driven ERP Development');
  console.log('═'.repeat(80));

  const results = {
    success: [],
    failed: [],
  };

  // Seed all datasets from catalog
  const datasets = [
    ['sales_orders', buildSalesOrdersSeed],
    ['finance_aging', buildFinanceAgingSeed],
    ['warehouse_workflow', buildWarehouseWorkflowSeed],
    ['purchase_data', buildPurchaseSeed],
    ['cycle_counts', buildCycleCountsSeed],
    ['crm_pipeline', buildCrmPipelineSeed],
    ['crm_activity', buildCrmActivitySeed],
    ['inventory_movements', buildInventoryMovementsSeed],
  ];

  for (const [key, builder] of datasets) {
    const success = await seedDataset(key, builder);
    if (success) results.success.push(key);
    else results.failed.push(key);
  }

  // Seed module events separately
  const eventsSuccess = await seedModuleEvents();
  if (eventsSuccess) results.success.push('module_events');
  else results.failed.push('module_events');

  console.log('\n' + '═'.repeat(80));
  console.log('📊 SEEDING SUMMARY');
  console.log('═'.repeat(80));
  console.log(`✅ Success: ${results.success.length} datasets`);
  console.log(`❌ Failed: ${results.failed.length} datasets`);
  
  if (results.failed.length > 0) {
    console.log('\nFailed datasets:', results.failed.join(', '));
  }

  console.log('\n📝 Seeded datasets:');
  results.success.forEach(key => console.log(`  - ${key}`));

  console.log('\n🎯 Next steps:');
  console.log('  1. Verify API endpoints return seeded data');
  console.log('  2. Check UI components display real data');
  console.log('  3. Test analytics engine computations');
  console.log('═'.repeat(80) + '\n');

  process.exit(results.failed.length > 0 ? 1 : 0);
}

runSeed().catch(err => {
  console.error('Fatal seed error:', err);
  process.exit(1);
});
