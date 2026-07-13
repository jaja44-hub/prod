import xmlrpc from 'xmlrpc';

const ODOO_URL = process.env.ODOO_URL || 'https://jafiface-addis-crown-erp.hf.space/odoo';
const ODOO_DB = process.env.ODOO_DB || 'neondb';
const ODOO_USER = process.env.ODOO_USER || 'admin';
const ODOO_PASSWORD = process.env.ODOO_PASSWORD || 'admin';

const REQUIRED_MODULES = [
  'sale',           // Sales Management
  'purchase',       // Purchase Management  
  'stock',          // Inventory/Warehouse
  'account',        // Accounting
  'crm',            // CRM
];

console.log('🔧 Session 2: Activate Required Odoo Modules');
console.log('==========================================\n');

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

async function authenticate() {
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

async function getModuleList(uid) {
  console.log('\n📋 Checking available modules...');
  const modules = await executeKw(uid, 'ir.module.module', 'search_read', 
    [['state', '=', 'uninstalled']],
    { fields: ['name', 'state', 'latest_version'], limit: 100 }
  );
  
  console.log(`  Found ${modules.length} uninstalled modules`);
  return modules;
}

async function activateModule(uid, moduleName) {
  console.log(`\n🔄 Activating ${moduleName}...`);
  
  try {
    // Check if module exists and is installable
    const moduleIds = await executeKw(uid, 'ir.module.module', 'search', 
      [['name', '=', moduleName]]
    );
    
    if (moduleIds.length === 0) {
      console.log(`  ⚠️  Module ${moduleName} not found`);
      return false;
    }
    
    const moduleId = moduleIds[0];
    
    // Get module info
    const moduleInfo = await executeKw(uid, 'ir.module.module', 'read', 
      [moduleId],
      { fields: ['name', 'state', 'latest_version'] }
    );
    
    console.log(`  📦 ${moduleInfo[0].name} (${moduleInfo[0].latest_version}) - Current state: ${moduleInfo[0].state}`);
    
    if (moduleInfo[0].state === 'installed') {
      console.log(`  ✅ Already installed`);
      return true;
    }
    
    // Install the module
    console.log(`  ⏳ Installing...`);
    await executeKw(uid, 'ir.module.module', 'button_immediate_install', [moduleId]);
    console.log(`  ✅ Successfully activated ${moduleName}`);
    return true;
    
  } catch (error) {
    console.error(`  ❌ Failed to activate ${moduleName}:`, error.message);
    return false;
  }
}

async function main() {
  try {
    const uid = await authenticate();
    
    // Get list of available modules
    const availableModules = await getModuleList(uid);
    const availableModuleNames = availableModules.map(m => m.name);
    
    console.log('\n🎯 Required modules to activate:');
    for (const mod of REQUIRED_MODULES) {
      const available = availableModuleNames.includes(mod);
      const status = available ? '✅ Available' : '❌ Not found';
      console.log(`  ${status} ${mod}`);
    }
    
    console.log('\n🚀 Starting module activation...\n');
    
    const results = {};
    for (const moduleName of REQUIRED_MODULES) {
      const success = await activateModule(uid, moduleName);
      results[moduleName] = success;
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📋 MODULE ACTIVATION SUMMARY');
    console.log('='.repeat(60));
    
    for (const [mod, success] of Object.entries(results)) {
      const status = success ? '✅' : '❌';
      console.log(`  ${status} ${mod}`);
    }
    
    const successCount = Object.values(results).filter(r => r).length;
    console.log(`\n✅ ${successCount}/${REQUIRED_MODULES.length} modules activated`);
    
    if (successCount === REQUIRED_MODULES.length) {
      console.log('\n🎉 All required modules activated successfully!');
      console.log('   Proceeding to Firestore audit and migration planning...\n');
    } else {
      console.log('\n⚠️  Some modules failed to activate.');
      console.log('   Manual activation may be required via Odoo web UI.\n');
    }
    
    return results;
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    console.error('\nIf programmatic activation fails, use manual activation via web UI:');
    console.error('1. Go to https://jafiface-addis-crown-erp.hf.space/odoo/apps');
    console.error('2. Search for: sale, purchase, stock, account, crm');
    console.error('3. Click "Activate" for each module');
    process.exit(1);
  }
}

main();
