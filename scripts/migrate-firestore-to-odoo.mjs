import xmlrpc from 'xmlrpc';
import { getFirebaseAdmin } from '../server/api/lib/firebaseAdmin.js';
import fs from 'fs';

// Configuration
const ODOO_URL = process.env.ODOO_URL || 'https://jafiface-addis-crown-erp.hf.space/odoo';
const ODOO_DB = process.env.ODOO_DB || 'neondb';
const ODOO_USER = process.env.ODOO_USER || 'admin';
const ODOO_PASSWORD = process.env.ODOO_PASSWORD || 'admin';
const DRY_RUN = process.env.DRY_RUN === 'true';

const COLLECTION = 'tenant_operational_data';
const TENANT_ID = 'production';

console.log('🔧 Session 2: Firestore to Odoo Migration Script');
console.log('================================================\n');
console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no changes)' : 'LIVE EXECUTION'}\n`);

// Odoo XML-RPC client
function getClient(path) {
  const url = new URL(ODOO_URL);
  const options = {
    host: url.hostname,
    port: url.port || (url.protocol === 'https:' ? 443 : 80),
    path,
  };

  return url.protocol === 'https:'
    ? xmlrpc.createSecureClient(options)
    : xmlrpc.createClient(options);
}

async function authenticateOdoo() {
  console.log('🔐 Authenticating with Odoo...');
  const client = getClient('/xmlrpc/2/common');
  
  const uid = await new Promise((resolve, reject) => {
    client.methodCall('authenticate', [ODOO_DB, ODOO_USER, ODOO_PASSWORD, {}], (error, value) => {
      if (error) reject(error);
      else resolve(value);
    });
  });

  if (uid) {
    console.log(`  ✅ Authenticated. UID: ${uid}`);
    return uid;
  } else {
    throw new Error('Authentication failed');
  }
}

async function executeKw(uid, model, method, args = [], kwargs = {}) {
  const client = getClient('/xmlrpc/2/object');
  
  return new Promise((resolve, reject) => {
    client.methodCall('execute_kw', [ODOO_DB, uid, ODOO_PASSWORD, model, method, args, kwargs], (error, value) => {
      if (error) reject(error);
      else resolve(value);
    });
  });
}

// Firestore data retrieval
async function getFirestoreData(datasetKey) {
  const admin = getFirebaseAdmin();
  if (!admin) {
    throw new Error('Firebase Admin not available');
  }

  const db = admin.firestore();
  const docId = `${TENANT_ID}__${datasetKey}`;
  const doc = await db.collection(COLLECTION).doc(docId).get();
  
  if (!doc.exists) {
    console.log(`  ⚠️  No data found for ${datasetKey}`);
    return null;
  }
  
  return doc.data();
}

// Helper: Convert ISO 8601 to Odoo datetime format (YYYY-MM-DD HH:MM:SS)
function toOdooDateTime(isoString) {
  if (!isoString) return new Date().toISOString().slice(0, 19).replace('T', ' ');
  const date = new Date(isoString);
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

// Helper: Map Firestore states to Odoo sale.order states
function mapSalesOrderState(firestoreState) {
  const stateMap = {
    'draft': 'draft',
    'confirmed': 'sale',
    'packed': 'sale',
    'shipped': 'sale',
    'cancelled': 'cancel',
    'delivered': 'sale',
  };
  return stateMap[firestoreState] || 'draft';
}

// Data transformation functions
function transformSalesOrder(firestoreOrder) {
  return {
    name: firestoreOrder.name || `SO-${Date.now()}`,
    date_order: toOdooDateTime(firestoreOrder.createdAt),
    state: mapSalesOrderState(firestoreOrder.state),
    amount_total: firestoreOrder.amount_total || 0,
    partner_id: 1, // Default customer (will be created/queried in production)
  };
}

function transformWarehousePick(firestorePick) {
  return {
    name: firestorePick.pickId || `WH-${Date.now()}`,
    state: firestorePick.status === 'ready' ? 'assigned' : 'draft',
    scheduled_date: toOdooDateTime(firestorePick.dueAt),
    location_id: 4, // Default stock location (will be created/queried in production)
    location_dest_id: 5, // Default customer location (will be created/queried in production)
    picking_type_id: 1, // Internal transfer type
  };
}

function transformFinanceInvoice(firestoreLine) {
  return {
    name: firestoreLine.invoiceId || `INV-${Date.now()}`,
    invoice_date: firestoreLine.dueDate || new Date().toISOString().split('T')[0],
    move_type: 'in_invoice',
    amount_total: firestoreLine.amount || 0,
  };
}

function transformPurchaseOrder(firestorePurchase) {
  return {
    name: firestorePurchase.purchaseId || `PO-${Date.now()}`,
    date_order: toOdooDateTime(firestorePurchase.orderDate),
    state: firestorePurchase.status || 'draft',
    amount_total: firestorePurchase.totalAmount || 0,
    partner_id: 1, // Default vendor (will be created/queried in production)
  };
}

function transformCrmLead(firestoreLead) {
  return {
    name: firestoreLead.leadName || `Lead-${Date.now()}`,
    stage_id: firestoreLead.stageId || null,
    probability: firestoreLead.probability || 0,
  };
}

// Migration functions
async function migrateSalesOrders(uid) {
  console.log('\n📦 Migrating Sales Orders...');
  const data = await getFirestoreData('sales_orders');
  
  if (!data || !data.records || data.records.length === 0) {
    console.log('  ⚠️  No sales orders to migrate');
    return { migrated: 0, failed: 0 };
  }
  
  let migrated = 0;
  let failed = 0;
  
  for (const record of data.records) {
    try {
      const odooOrder = transformSalesOrder(record);
      
      // Check if record already exists
      const existing = await executeKw(uid, 'sale.order', 'search', [[['name', '=', odooOrder.name]]]);
      
      if (existing.length > 0) {
        console.log(`  ⏭️  Skipping existing sale order: ${odooOrder.name}`);
        continue;
      }
      
      if (DRY_RUN) {
        console.log(`  [DRY] Would create: ${odooOrder.name}`);
        migrated++;
      } else {
        const orderId = await executeKw(uid, 'sale.order', 'create', [odooOrder]);
        console.log(`  ✅ Created sale order: ${orderId} - ${odooOrder.name}`);
        migrated++;
      }
    } catch (error) {
      console.error(`  ❌ Failed to migrate sales order: ${error.message}`);
      failed++;
    }
  }
  
  return { migrated, failed };
}

async function migrateWarehouseData(uid) {
  console.log('\n📦 Migrating Warehouse Data...');
  const data = await getFirestoreData('warehouse_workflow');
  
  if (!data || !data.picks || data.picks.length === 0) {
    console.log('  ⚠️  No warehouse data to migrate');
    return { migrated: 0, failed: 0 };
  }
  
  let migrated = 0;
  let failed = 0;
  
  for (const pick of data.picks) {
    try {
      const odooPick = transformWarehousePick(pick);
      
      // Check if record already exists
      const existing = await executeKw(uid, 'stock.picking', 'search', [[['name', '=', odooPick.name]]]);
      
      if (existing.length > 0) {
        console.log(`  ⏭️  Skipping existing picking: ${odooPick.name}`);
        continue;
      }
      
      if (DRY_RUN) {
        console.log(`  [DRY] Would create: ${odooPick.name}`);
        migrated++;
      } else {
        const pickId = await executeKw(uid, 'stock.picking', 'create', [odooPick]);
        console.log(`  ✅ Created picking: ${pickId} - ${odooPick.name}`);
        migrated++;
      }
    } catch (error) {
      console.error(`  ❌ Failed to migrate picking: ${error.message}`);
      failed++;
    }
  }
  
  return { migrated, failed };
}

async function migrateFinanceData(uid) {
  console.log('\n📦 Migrating Finance Data...');
  const data = await getFirestoreData('finance_aging');
  
  if (!data || !data.vendorLines || data.vendorLines.length === 0) {
    console.log('  ⚠️  No finance data to migrate');
    return { migrated: 0, failed: 0 };
  }
  
  let migrated = 0;
  let failed = 0;
  
  for (const line of data.vendorLines) {
    try {
      const odooInvoice = transformFinanceInvoice(line);
      
      // Check if record already exists
      const existing = await executeKw(uid, 'account.move', 'search', [[['name', '=', odooInvoice.name]]]);
      
      if (existing.length > 0) {
        console.log(`  ⏭️  Skipping existing invoice: ${odooInvoice.name}`);
        continue;
      }
      
      if (DRY_RUN) {
        console.log(`  [DRY] Would create: ${odooInvoice.name}`);
        migrated++;
      } else {
        const invoiceId = await executeKw(uid, 'account.move', 'create', [odooInvoice]);
        console.log(`  ✅ Created invoice: ${invoiceId} - ${odooInvoice.name}`);
        migrated++;
      }
    } catch (error) {
      console.error(`  ❌ Failed to migrate invoice: ${error.message}`);
      failed++;
    }
  }
  
  return { migrated, failed };
}

async function migratePurchaseData(uid) {
  console.log('\n📦 Migrating Purchase Data...');
  const data = await getFirestoreData('purchase_data');
  
  if (!data || !data.purchases || data.purchases.length === 0) {
    console.log('  ⚠️  No purchase data to migrate');
    return { migrated: 0, failed: 0 };
  }
  
  let migrated = 0;
  let failed = 0;
  
  for (const purchase of data.purchases) {
    try {
      const odooPurchase = transformPurchaseOrder(purchase);
      
      // Check if record already exists
      const existing = await executeKw(uid, 'purchase.order', 'search', [[['name', '=', odooPurchase.name]]]);
      
      if (existing.length > 0) {
        console.log(`  ⏭️  Skipping existing purchase order: ${odooPurchase.name}`);
        continue;
      }
      
      if (DRY_RUN) {
        console.log(`  [DRY] Would create: ${odooPurchase.name}`);
        migrated++;
      } else {
        const purchaseId = await executeKw(uid, 'purchase.order', 'create', [odooPurchase]);
        console.log(`  ✅ Created purchase order: ${purchaseId} - ${odooPurchase.name}`);
        migrated++;
      }
    } catch (error) {
      console.error(`  ❌ Failed to migrate purchase order: ${error.message}`);
      failed++;
    }
  }
  
  return { migrated, failed };
}

async function migrateCrmData(uid) {
  console.log('\n📦 Migrating CRM Data...');
  const data = await getFirestoreData('crm_pipeline');
  
  if (!data || !data.leads || data.leads.length === 0) {
    console.log('  ⚠️  No CRM data to migrate');
    return { migrated: 0, failed: 0 };
  }
  
  let migrated = 0;
  let failed = 0;
  
  for (const lead of data.leads) {
    try {
      const odooLead = transformCrmLead(lead);
      
      // Check if record already exists
      const existing = await executeKw(uid, 'crm.lead', 'search', [[['name', '=', odooLead.name]]]);
      
      if (existing.length > 0) {
        console.log(`  ⏭️  Skipping existing lead: ${odooLead.name}`);
        continue;
      }
      
      if (DRY_RUN) {
        console.log(`  [DRY] Would create: ${odooLead.name}`);
        migrated++;
      } else {
        const leadId = await executeKw(uid, 'crm.lead', 'create', [odooLead]);
        console.log(`  ✅ Created lead: ${leadId} - ${odooLead.name}`);
        migrated++;
      }
    } catch (error) {
      console.error(`  ❌ Failed to migrate lead: ${error.message}`);
      failed++;
    }
  }
  
  return { migrated, failed };
}

// Main migration function
async function main() {
  try {
    const uid = await authenticateOdoo();
    
    const results = {
      salesOrders: await migrateSalesOrders(uid),
      warehouse: await migrateWarehouseData(uid),
      finance: await migrateFinanceData(uid),
      purchase: await migratePurchaseData(uid),
      crm: await migrateCrmData(uid),
    };
    
    console.log('\n' + '='.repeat(60));
    console.log('📋 MIGRATION SUMMARY');
    console.log('='.repeat(60));
    
    const totalMigrated = Object.values(results).reduce((sum, r) => sum + r.migrated, 0);
    const totalFailed = Object.values(results).reduce((sum, r) => sum + r.failed, 0);
    
    console.log(`\nSales Orders: ${results.salesOrders.migrated} migrated, ${results.salesOrders.failed} failed`);
    console.log(`Warehouse: ${results.warehouse.migrated} migrated, ${results.warehouse.failed} failed`);
    console.log(`Finance: ${results.finance.migrated} migrated, ${results.finance.failed} failed`);
    console.log(`Purchase: ${results.purchase.migrated} migrated, ${results.purchase.failed} failed`);
    console.log(`CRM: ${results.crm.migrated} migrated, ${results.crm.failed} failed`);
    
    console.log(`\n📊 Total: ${totalMigrated} migrated, ${totalFailed} failed`);
    
    if (DRY_RUN) {
      console.log('\n⚠️  DRY RUN COMPLETE - No changes made to Odoo');
      console.log('   To execute actual migration, run without DRY_RUN=true');
    } else {
      console.log('\n✅ MIGRATION COMPLETE');
    }
    
    console.log('='.repeat(60) + '\n');
    
  } catch (error) {
    console.error('\n❌ Fatal error during migration:', error.message);
    console.error(error);
    process.exit(1);
  }
}

main();
