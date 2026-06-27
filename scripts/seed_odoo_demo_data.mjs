import xmlrpc from 'xmlrpc';

// -------------------------------------------------------------
// SECURE CREDENTIALS (for direct XML-RPC access without Vercel)
// -------------------------------------------------------------
const ODOO_URL = 'https://jafiface-addis-crown-erp.hf.space';
const ODOO_DB = 'POSTGRES_DATABASE=neondb';
const ODOO_USER = 'admin';
const ODOO_APIKEY = '6c034bd45544684399d58e003b41f70c95a04fe5';

console.log('Connecting to Odoo directly via XML-RPC to seed demo data...');

// Initialize Common (Auth) and Object (Execute) Clients
const commonClient = xmlrpc.createSecureClient({ url: `${ODOO_URL}/xmlrpc/2/common` });
const objectClient = xmlrpc.createSecureClient({ url: `${ODOO_URL}/xmlrpc/2/object` });

// Async Wrapper for Authentication
function authenticate() {
  return new Promise((resolve, reject) => {
    commonClient.methodCall('authenticate', [ODOO_DB, ODOO_USER, ODOO_APIKEY, {}], (err, uid) => {
      if (err || !uid) return reject(err || 'Authentication failed');
      resolve(uid);
    });
  });
}

// Async Wrapper for execute_kw
function execute(uid, model, method, args, kwargs = {}) {
  return new Promise((resolve, reject) => {
    objectClient.methodCall('execute_kw', [ODOO_DB, uid, ODOO_APIKEY, model, method, args, kwargs], (err, value) => {
      if (err) return reject(err);
      resolve(value);
    });
  });
}

// Demo Data Definitions for Addis Crown Manufacturing and Sales
const partnersData = [
  { name: 'Safaricom Ethiopia', is_company: true, customer_rank: 1, city: 'Addis Ababa', email: 'procurement@safaricom.et' },
  { name: 'Awash Bank HQ', is_company: true, customer_rank: 1, city: 'Addis Ababa', email: 'hq.admin@awashbank.com' },
  { name: 'Oromia Coffee Cooperative', is_company: true, customer_rank: 1, city: 'Bishoftu', email: 'supply@oromiacoffee.coop' },
  { name: 'Ethio-Aluminum Importers', is_company: true, supplier_rank: 1, city: 'Hawassa', email: 'sales@ethioaluminum.com' },
  { name: 'Global Glass Works Ltd', is_company: true, supplier_rank: 1, city: 'Adama', email: 'orders@globalglass.com' }
];

const productsData = [
  { name: 'Premium Aluminum Window Frame', list_price: 15000, default_code: 'ALU-WIN-01', active: true },
  { name: 'Standard Office Door (Glass/Alu)', list_price: 22000, default_code: 'ALU-DOR-01', active: true },
  { name: 'Raw Aluminum Profile (6m)', list_price: 4500, default_code: 'RAW-ALU-06', active: true },
  { name: 'Tempered Glass Pane (1m x 1m)', list_price: 8000, default_code: 'RAW-GLS-01', active: true }
];

const employeesData = [
  { name: 'Abebe Kebede', job_title: 'Factory Manager', work_email: 'abebe.k@addiscrown.com' },
  { name: 'Tigist Haile', job_title: 'Procurement Officer', work_email: 'tigist.h@addiscrown.com' },
  { name: 'Yonas Mekonnen', job_title: 'Lead Assembler', work_email: 'yonas.m@addiscrown.com' },
  { name: 'Makeda Bekele', job_title: 'Sales Director', work_email: 'makeda.b@addiscrown.com' }
];

async function run() {
  try {
    console.log('1. Authenticating...');
    const uid = await authenticate();
    console.log(`✅ Authenticated! UID: ${uid}`);

    // Seed Partners (Customers & Vendors)
    console.log('\n2. Seeding Partners (Customers & Vendors)...');
    let partnerIds = [];
    for (const partner of partnersData) {
      const existing = await execute(uid, 'res.partner', 'search', [[['name', '=', partner.name]]]);
      if (existing.length === 0) {
        const id = await execute(uid, 'res.partner', 'create', [partner]);
        console.log(`  ➕ Created Partner: ${partner.name} (ID: ${id})`);
        partnerIds.push(id);
      } else {
        console.log(`  ⏭️ Skipped Partner (Already exists): ${partner.name}`);
        partnerIds.push(existing[0]);
      }
    }

    // Seed Products
    console.log('\n3. Seeding Products...');
    let productIds = [];
    for (const product of productsData) {
      const existing = await execute(uid, 'product.product', 'search', [[['name', '=', product.name]]]);
      if (existing.length === 0) {
        const id = await execute(uid, 'product.product', 'create', [product]);
        console.log(`  ➕ Created Product: ${product.name} (ID: ${id})`);
        productIds.push(id);
      } else {
        console.log(`  ⏭️ Skipped Product (Already exists): ${product.name}`);
        productIds.push(existing[0]);
      }
    }

    // Seed Employees
    console.log('\n4. Seeding Employees...');
    for (const emp of employeesData) {
      const existing = await execute(uid, 'hr.employee', 'search', [[['name', '=', emp.name]]]);
      if (existing.length === 0) {
        try {
           const id = await execute(uid, 'hr.employee', 'create', [emp]);
           console.log(`  ➕ Created Employee: ${emp.name} (ID: ${id})`);
        } catch(e) {
           console.log(`  ⚠️ Failed to create employee (HR module might not be installed). Skipping.`);
        }
      } else {
        console.log(`  ⏭️ Skipped Employee (Already exists): ${emp.name}`);
      }
    }

    // Creating sample Purchase Order (if module exists)
    console.log('\n5. Creating Sample Purchase Order...');
    try {
        const poVendor = partnerIds[3]; // Ethio-Aluminum
        const poProduct = productIds[2]; // Raw Alu Profile
        const poId = await execute(uid, 'purchase.order', 'create', [{ partner_id: poVendor }]);
        
        await execute(uid, 'purchase.order.line', 'create', [{
            order_id: poId,
            product_id: poProduct,
            name: 'Raw Aluminum Profile (6m) - Qty 50',
            product_qty: 50,
            price_unit: 4500
        }]);
        console.log(`  ➕ Created Sample PO (ID: ${poId})`);
    } catch (e) {
        console.log(`  ⚠️ Could not create PO (Purchase module missing or error): ${e.message}`);
    }

    // Creating sample Sales Order (if module exists)
    console.log('\n6. Creating Sample Sales Order...');
    try {
        const soCustomer = partnerIds[0]; // Safaricom
        const soProduct = productIds[0]; // Premium Window
        const soId = await execute(uid, 'sale.order', 'create', [{ partner_id: soCustomer }]);
        
        await execute(uid, 'sale.order.line', 'create', [{
            order_id: soId,
            product_id: soProduct,
            product_uom_qty: 15,
            price_unit: 15000
        }]);
        console.log(`  ➕ Created Sample SO (ID: ${soId})`);
    } catch (e) {
        console.log(`  ⚠️ Could not create SO (Sales module missing or error): ${e.message}`);
    }

    console.log('\n✅ GRAND ODOO SEEDING COMPLETE! You can now view the data in the Dashboard.');
  } catch (error) {
    console.error('\n❌ SEEDING FAILED:', error);
  }
}

run();
