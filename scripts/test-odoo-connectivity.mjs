import xmlrpc from 'xmlrpc';
import { getFirebaseAdmin } from '../server/api/lib/firebaseAdmin.js';

// Accept command-line arguments or environment variables
const args = process.argv.slice(2);
const ODOO_URL = args[0] || process.env.ODOO_URL || 'https://jafiface-addis-crown-erp.hf.space/odoo';
const ODOO_DB = args[1] || process.env.ODOO_DB || 'neondb';
const ODOO_USER = args[2] || process.env.ODOO_USER || 'admin';
const ODOO_APIKEY = args[3] || process.env.ODOO_APIKEY || 'admin';

console.log('🔍 Session 1: Odoo Connectivity Verification');
console.log('===========================================\n');

// Check credentials
console.log('📋 Credentials Check:');
console.log(`  ODOO_URL: ${ODOO_URL ? '✅ Set' : '❌ Missing'}`);
console.log(`  ODOO_DB: ${ODOO_DB ? '✅ Set' : '❌ Missing'}`);
console.log(`  ODOO_USER: ${ODOO_USER ? '✅ Set' : '❌ Missing'}`);
console.log(`  ODOO_APIKEY: ${ODOO_APIKEY ? '✅ Set' : '❌ Missing'}`);

if (!ODOO_URL || !ODOO_DB || !ODOO_USER || !ODOO_APIKEY) {
  console.error('\n❌ Missing required credentials. Cannot proceed.');
  console.error('Usage: node scripts/test-odoo-connectivity.mjs <URL> <DB> <USER> <APIKEY>');
  process.exit(1);
}

console.log('\n');

// Create XML-RPC client
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

// Authenticate with Odoo
async function authenticateOdoo() {
  console.log('🔐 Testing Odoo Authentication...');
  console.log(`  URL: ${ODOO_URL}`);
  console.log(`  DB: ${ODOO_DB}`);
  console.log(`  User: ${ODOO_USER}`);
  console.log(`  API Key: ${ODOO_APIKEY.substring(0, 10)}...`);
  
  try {
    const client = getClient('/xmlrpc/2/common');
    
    const uid = await new Promise((resolve, reject) => {
      client.methodCall('authenticate', [ODOO_DB, ODOO_USER, ODOO_APIKEY, {}], (error, value) => {
        if (error) reject(error);
        else resolve(value);
      });
    });

    if (uid) {
      console.log(`  ✅ Authentication successful. UID: ${uid}`);
      return uid;
    } else {
      console.log('  ❌ Authentication failed - no UID returned');
      console.log('  ⚠️  Possible causes:');
      console.log('     - Incorrect database name');
      console.log('     - Incorrect API key');
      console.log('     - Odoo instance not running');
      console.log('     - Network connectivity issue');
      return null;
    }
  } catch (error) {
    console.error(`  ❌ Authentication failed: ${error.message}`);
    console.error(`  Error details:`, error);
    return null;
  }
}

// Execute Odoo query
async function executeKw(uid, model, method, args = [], kwargs = {}) {
  const client = getClient('/xmlrpc/2/object');
  
  return new Promise((resolve, reject) => {
    client.methodCall('execute_kw', [ODOO_DB, uid, ODOO_APIKEY, model, method, args, kwargs], (error, value) => {
      if (error) reject(error);
      else resolve(value);
    });
  });
}

// Query specific models
async function queryModel(uid, model, domain = [], fields = [], limit = 10) {
  console.log(`\n📊 Querying ${model}...`);
  try {
    const result = await executeKw(uid, model, 'search_read', [domain], { fields, limit });
    console.log(`  ✅ Found ${result.length} records`);
    
    if (result.length > 0) {
      console.log(`  📝 Sample record:`, JSON.stringify(result[0], null, 2).split('\n').map(l => '    ' + l).join('\n'));
    }
    
    return result;
  } catch (error) {
    console.error(`  ❌ Query failed: ${error.message}`);
    return [];
  }
}

// Count records in a model
async function countRecords(uid, model, domain = []) {
  try {
    const count = await executeKw(uid, model, 'search_count', [domain], {});
    return count;
  } catch (error) {
    console.error(`  ❌ Count failed for ${model}: ${error.message}`);
    return 0;
  }
}

// Main verification function
async function main() {
  console.log('\n🚀 Starting Odoo Connectivity Tests...\n');

  // Test authentication
  const uid = await authenticateOdoo();
  if (!uid) {
    console.error('\n❌ Cannot proceed without authentication.');
    process.exit(1);
  }

  console.log('\n');

  // Test key models
  const modelsToTest = [
    {
      model: 'res.partner',
      name: 'Partners (Customers/Vendors)',
      domain: [],
      fields: ['id', 'name', 'email', 'supplier_rank', 'customer_rank'],
    },
    {
      model: 'stock.picking',
      name: 'Warehouse Pickings',
      domain: [],
      fields: ['id', 'name', 'state', 'picking_type_id', 'scheduled_date'],
    },
    {
      model: 'account.move',
      name: 'Account Moves (Invoices)',
      domain: [],
      fields: ['id', 'name', 'move_type', 'state', 'amount_total'],
    },
    {
      model: 'sale.order',
      name: 'Sales Orders',
      domain: [],
      fields: ['id', 'name', 'state', 'amount_total', 'date_order'],
    },
    {
      model: 'purchase.order',
      name: 'Purchase Orders',
      domain: [],
      fields: ['id', 'name', 'state', 'amount_total', 'date_order'],
    },
    {
      model: 'crm.lead',
      name: 'CRM Leads',
      domain: [],
      fields: ['id', 'name', 'stage_id', 'probability'],
    },
    {
      model: 'product.product',
      name: 'Products',
      domain: [],
      fields: ['id', 'name', 'default_code', 'qty_available'],
    },
  ];

  const results = {};
  
  for (const modelInfo of modelsToTest) {
    const records = await queryModel(uid, modelInfo.model, modelInfo.domain, modelInfo.fields, 5);
    const totalCount = await countRecords(uid, modelInfo.model, modelInfo.domain);
    
    results[modelInfo.model] = {
      name: modelInfo.name,
      totalCount,
      sampleRecords: records,
    };
    
    console.log(`  📈 Total records in ${modelInfo.model}: ${totalCount}`);
  }

  // Generate report
  console.log('\n' + '='.repeat(60));
  console.log('📋 ODOO CONNECTIVITY VERIFICATION REPORT');
  console.log('='.repeat(60));
  console.log(`\nTimestamp: ${new Date().toISOString()}`);
  console.log(`Odoo URL: ${ODOO_URL}`);
  console.log(`Database: ${ODOO_DB}`);
  console.log(`User: ${ODOO_USER}`);
  console.log(`Authentication: ✅ Successful (UID: ${uid})\n`);

  console.log('📊 Data Inventory:');
  for (const [model, data] of Object.entries(results)) {
    const status = data.totalCount > 0 ? '✅' : '⚠️';
    console.log(`  ${status} ${model} (${data.name}): ${data.totalCount} records`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Session 1 Complete: Odoo Connectivity Verified');
  console.log('='.repeat(60) + '\n');

  // Check if Odoo has data
  const totalRecords = Object.values(results).reduce((sum, r) => sum + r.totalCount, 0);
  if (totalRecords === 0) {
    console.log('⚠️  WARNING: Odoo instance has no data in key models.');
    console.log('   Migration from Firestore will be required.\n');
  } else {
    console.log('✅ Odoo instance contains operational data.');
    console.log('   Migration from Firestore may still be needed for consistency.\n');
  }

  return results;
}

// Run the verification
main().catch(error => {
  console.error('\n❌ Fatal error during verification:', error);
  process.exit(1);
});
