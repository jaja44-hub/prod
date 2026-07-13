import { getFirebaseAdmin } from '../server/api/lib/firebaseAdmin.js';

const COLLECTION = 'tenant_operational_data';
const TENANT_ID = 'production';

console.log('🔍 Session 2: Firestore Data Audit');
console.log('==================================\n');

async function auditFirestoreData() {
  try {
    const admin = getFirebaseAdmin();
    if (!admin) {
      console.error('❌ Firebase Admin not available');
      process.exit(1);
    }

    const db = admin.firestore();
    console.log(`📊 Auditing collection: ${COLLECTION}`);
    console.log(`🏢 Tenant ID: ${TENANT_ID}\n`);

    // Get all documents in the collection
    const snapshot = await db.collection(COLLECTION).get();
    
    if (snapshot.empty) {
      console.log('⚠️  No documents found in tenant_operational_data collection');
      return [];
    }

    console.log(`✅ Found ${snapshot.size} documents\n`);

    const auditResults = [];
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const docId = doc.id;
      
      // Parse document ID format: tenantId__datasetKey
      const parts = docId.split('__');
      const tenantId = parts[0];
      const datasetKey = parts[1];
      
      console.log(`📄 Document: ${docId}`);
      console.log(`   Tenant: ${tenantId}`);
      console.log(`   Dataset: ${datasetKey}`);
      
      // Analyze data structure
      const analysis = {
        docId,
        tenantId,
        datasetKey,
        recordCount: 0,
        dataTypes: {},
        sampleRecords: [],
      };
      
      if (data.records && Array.isArray(data.records)) {
        analysis.recordCount = data.records.length;
        console.log(`   Records: ${data.records.length}`);
        
        // Analyze first record structure
        if (data.records.length > 0) {
          const sample = data.records[0];
          analysis.sampleRecords.push(sample);
          
          // Identify data types
          for (const [key, value] of Object.entries(sample)) {
            const type = typeof value;
            analysis.dataTypes[key] = type;
          }
          
          console.log(`   Sample record keys:`, Object.keys(sample).join(', '));
        }
      } else if (data.picks) {
        analysis.recordCount = data.picks?.length || 0;
        console.log(`   Picks: ${data.picks?.length || 0}`);
        if (data.picks?.length > 0) {
          analysis.sampleRecords.push(data.picks[0]);
        }
      } else if (data.vendorLines) {
        analysis.recordCount = data.vendorLines?.length || 0;
        console.log(`   Vendor Lines: ${data.vendorLines?.length || 0}`);
        if (data.vendorLines?.length > 0) {
          analysis.sampleRecords.push(data.vendorLines[0]);
        }
      } else if (data.customerLines) {
        analysis.recordCount = data.customerLines?.length || 0;
        console.log(`   Customer Lines: ${data.customerLines?.length || 0}`);
        if (data.customerLines?.length > 0) {
          analysis.sampleRecords.push(data.customerLines[0]);
        }
      } else if (data.leads) {
        analysis.recordCount = data.leads?.length || 0;
        console.log(`   Leads: ${data.leads?.length || 0}`);
        if (data.leads?.length > 0) {
          analysis.sampleRecords.push(data.leads[0]);
        }
      } else if (data.purchases) {
        analysis.recordCount = data.purchases?.length || 0;
        console.log(`   Purchases: ${data.purchases?.length || 0}`);
        if (data.purchases?.length > 0) {
          analysis.sampleRecords.push(data.purchases[0]);
        }
      } else {
        console.log(`   Data structure:`, Object.keys(data).join(', '));
      }
      
      auditResults.push(analysis);
      console.log();
    }
    
    return auditResults;
    
  } catch (error) {
    console.error('❌ Audit failed:', error.message);
    throw error;
  }
}

async function generateAuditReport(auditResults) {
  console.log('='.repeat(60));
  console.log('📋 FIRESTORE DATA AUDIT REPORT');
  console.log('='.repeat(60));
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`Collection: ${COLLECTION}`);
  console.log(`Tenant: ${TENANT_ID}\n`);
  
  console.log('📊 Summary:');
  console.log(`  Total documents: ${auditResults.length}`);
  console.log(`  Total records: ${auditResults.reduce((sum, r) => sum + r.recordCount, 0)}\n`);
  
  console.log('📄 Document Details:');
  for (const result of auditResults) {
    console.log(`\n  🗂️  ${result.datasetKey}`);
    console.log(`     Records: ${result.recordCount}`);
    console.log(`     Data types:`, JSON.stringify(result.dataTypes, null, 6).split('\n').map(l => '       ' + l).join('\n'));
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Audit Complete');
  console.log('='.repeat(60) + '\n');
  
  return auditResults;
}

async function main() {
  try {
    const auditResults = await auditFirestoreData();
    await generateAuditReport(auditResults);
    
    // Save audit results for migration script
    const fs = await import('fs');
    fs.writeFileSync(
      '/tmp/firestore-audit-results.json',
      JSON.stringify(auditResults, null, 2)
    );
    console.log('💾 Audit results saved to /tmp/firestore-audit-results.json\n');
    
  } catch (error) {
    console.error('\n❌ Fatal error during audit:', error);
    process.exit(1);
  }
}

main();
