import xmlrpc from 'xmlrpc';
import { authenticateOdooDb } from '../server/api/lib/resolveOdooDb.js';

const { ODOO_URL, ODOO_DB, ODOO_USER, ODOO_APIKEY } = process.env;
let activeDb = ODOO_DB;

if (!ODOO_URL || !ODOO_DB || !ODOO_USER || !ODOO_APIKEY) {
  console.error('Missing env: ODOO_URL, ODOO_DB, ODOO_USER, ODOO_APIKEY');
  process.exit(1);
}

console.log('Connecting to Odoo directly via XML-RPC to seed demo data...');

const normalizedUrl = ODOO_URL.replace(/\/+$/, '');
const commonClient = xmlrpc.createSecureClient({ url: `${normalizedUrl}/xmlrpc/2/common` });
const objectClient = xmlrpc.createSecureClient({ url: `${normalizedUrl}/xmlrpc/2/object` });

async function authenticate() {
  const session = await authenticateOdooDb(commonClient, ODOO_DB, ODOO_USER, ODOO_APIKEY);
  if (!session) {
    throw new Error(
      `Authentication failed for ODOO_DB="${ODOO_DB}". On Hugging Face, try ODOO_DB="POSTGRES_DATABASE=neondb".`
    );
  }
  if (session.db !== ODOO_DB) {
    console.log(`ℹ️  Resolved ODOO_DB "${ODOO_DB}" → "${session.db}"`);
  }
  activeDb = session.db;
  return session.uid;
}

function execute(uid, model, method, args, kwargs = {}) {
  return new Promise((resolve, reject) => {
    objectClient.methodCall('execute_kw', [activeDb, uid, ODOO_APIKEY, model, method, args, kwargs], (err, value) => {
      if (err) return reject(err);
      resolve(value);
    });
  });
}

const partnersData = [
  { name: 'Safaricom Ethiopia', is_company: true, customer_rank: 1, city: 'Addis Ababa', email: 'procurement@safaricom.et' },
  { name: 'Awash Bank HQ', is_company: true, customer_rank: 1, city: 'Addis Ababa', email: 'hq.admin@awashbank.com' },
  { name: 'Oromia Coffee Cooperative', is_company: true, customer_rank: 1, city: 'Bishoftu', email: 'supply@oromiacoffee.coop' },
  { name: 'Ethio-Aluminum Importers', is_company: true, supplier_rank: 1, city: 'Hawassa', email: 'sales@ethioaluminum.com' },
  { name: 'Global Glass Works Ltd', is_company: true, supplier_rank: 1, city: 'Adama', email: 'orders@globalglass.com' },
  { name: 'Addis Crown Manufacturing', is_company: true, customer_rank: 1, supplier_rank: 1, city: 'Addis Ababa', email: 'info@addiscrown.com' },
  { name: 'Blue Nile Building Supply', is_company: true, supplier_rank: 1, city: 'Bahir Dar', email: 'purchasing@bluenilebuildings.com' },
  { name: 'Meskel Square Retail', is_company: true, customer_rank: 1, city: 'Addis Ababa', email: 'sales@meskelsquare.com' }
];

const productsData = [
  { name: 'Premium Aluminum Window Frame', list_price: 15000, default_code: 'ALU-WIN-01', active: true },
  { name: 'Standard Office Door (Glass/Alu)', list_price: 22000, default_code: 'ALU-DOR-01', active: true },
  { name: 'Raw Aluminum Profile (6m)', list_price: 4500, default_code: 'RAW-ALU-06', active: true },
  { name: 'Tempered Glass Pane (1m x 1m)', list_price: 8000, default_code: 'RAW-GLS-01', active: true },
  { name: 'Industrial Steel Hinges', list_price: 1200, default_code: 'STL-HNG-01', active: true },
  { name: 'High Strength Bolt Set', list_price: 450, default_code: 'STL-BLT-01', active: true },
  { name: 'Polymer Sealant Tube', list_price: 650, default_code: 'PLM-SLT-01', active: true },
  { name: 'Glass Curtain Wall Kit', list_price: 52000, default_code: 'GLS-KIT-01', active: true },
  { name: 'Factory Assembly Labor Service', list_price: 3000, default_code: 'SRV-ASB-01', active: true },
  { name: 'Window Packing Crate', list_price: 2200, default_code: 'PKG-CRT-01', active: true },
  { name: 'Delivery Freight Charge', list_price: 12000, default_code: 'SRV-FRT-01', active: true }
];

const employeesData = [
  { name: 'Abebe Kebede', job_title: 'Factory Manager', work_email: 'abebe.k@addiscrown.com' },
  { name: 'Tigist Haile', job_title: 'Procurement Officer', work_email: 'tigist.h@addiscrown.com' },
  { name: 'Yonas Mekonnen', job_title: 'Lead Assembler', work_email: 'yonas.m@addiscrown.com' },
  { name: 'Makeda Bekele', job_title: 'Sales Director', work_email: 'makeda.b@addiscrown.com' },
  { name: 'Selamawit Alemu', job_title: 'Quality Control Lead', work_email: 'selamawit.a@addiscrown.com' }
];

async function run() {
  try {
    console.log('1. Authenticating...');
    const uid = await authenticate();
    console.log(`✅ Authenticated! UID: ${uid}`);

    console.log('\n2. Seeding Partners (Customers & Vendors)...');
    const partnerIds = [];
    for (const partner of partnersData) {
      const existing = await execute(uid, 'res.partner', 'search', [[['name', '=', partner.name]]]);
      if (existing.length === 0) {
        const createdId = await execute(uid, 'res.partner', 'create', [partner]);
        console.log(`  ➕ Created Partner: ${partner.name} (ID: ${createdId})`);
        partnerIds.push(createdId);
      } else {
        console.log(`  ⏭️ Skipped Partner (Already exists): ${partner.name}`);
        partnerIds.push(existing[0]);
      }
    }

    console.log('\n3. Seeding Products...');
    const productIds = [];
    for (const product of productsData) {
      const existing = await execute(uid, 'product.product', 'search', [[['default_code', '=', product.default_code]]]);
      if (existing.length === 0) {
        const createdId = await execute(uid, 'product.product', 'create', [product]);
        console.log(`  ➕ Created Product: ${product.name} (ID: ${createdId})`);
        productIds.push(createdId);
      } else {
        console.log(`  ⏭️ Skipped Product (Already exists): ${product.name}`);
        productIds.push(existing[0]);
      }
    }

    console.log('\n4. Seeding Employees...');
    for (const emp of employeesData) {
      const existing = await execute(uid, 'hr.employee', 'search', [[['name', '=', emp.name]]]);
      if (existing.length === 0) {
        try {
          const createdId = await execute(uid, 'hr.employee', 'create', [emp]);
          console.log(`  ➕ Created Employee: ${emp.name} (ID: ${createdId})`);
        } catch (err) {
          console.log(`  ⚠️ Failed to create Employee ${emp.name} (HR module may be missing): ${String(err)}`);
        }
      } else {
        console.log(`  ⏭️ Skipped Employee (Already exists): ${emp.name}`);
      }
    }

    console.log('\n5. Creating Sample Purchase Orders...');
    const purchaseOrders = [
      { origin: 'DEMO-PO-ALU-1', vendorIndex: 3, productIndex: 2, productQty: 40, priceUnit: 4500 },
      { origin: 'DEMO-PO-GLASS-2', vendorIndex: 4, productIndex: 3, productQty: 20, priceUnit: 8000 },
      { origin: 'DEMO-PO-ALU-3', vendorIndex: 6, productIndex: 0, productQty: 10, priceUnit: 15000 }
    ];
    for (const po of purchaseOrders) {
      const existing = await execute(uid, 'purchase.order', 'search', [[['origin', '=', po.origin]]]);
      if (existing.length === 0) {
        try {
          const orderId = await execute(uid, 'purchase.order', 'create', [{ partner_id: partnerIds[po.vendorIndex], origin: po.origin }]);
          await execute(uid, 'purchase.order.line', 'create', [{
            order_id: orderId,
            product_id: productIds[po.productIndex],
            name: `Demo order line for ${po.origin}`,
            product_qty: po.productQty,
            price_unit: po.priceUnit
          }]);
          console.log(`  ➕ Created Purchase Order: ${po.origin} (ID: ${orderId})`);
        } catch (err) {
          console.log(`  ⚠️ Skipped Purchase Order ${po.origin} (purchase module may be missing): ${String(err)}`);
        }
      } else {
        console.log(`  ⏭️ Skipped Purchase Order (Already exists): ${po.origin}`);
      }
    }

    console.log('\n6. Creating Sample Sales Orders...');
    const salesOrders = [
      { origin: 'DEMO-SO-1', customerIndex: 0, productIndex: 0, productQty: 12, priceUnit: 15000 },
      { origin: 'DEMO-SO-2', customerIndex: 1, productIndex: 1, productQty: 5, priceUnit: 22000 },
      { origin: 'DEMO-SO-3', customerIndex: 2, productIndex: 3, productQty: 8, priceUnit: 8000 }
    ];
    for (const so of salesOrders) {
      const existing = await execute(uid, 'sale.order', 'search', [[['origin', '=', so.origin]]]);
      if (existing.length === 0) {
        try {
          const orderId = await execute(uid, 'sale.order', 'create', [{ partner_id: partnerIds[so.customerIndex], origin: so.origin }]);
          await execute(uid, 'sale.order.line', 'create', [{
            order_id: orderId,
            product_id: productIds[so.productIndex],
            product_uom_qty: so.productQty,
            price_unit: so.priceUnit
          }]);
          console.log(`  ➕ Created Sales Order: ${so.origin} (ID: ${orderId})`);
        } catch (err) {
          console.log(`  ⚠️ Skipped Sales Order ${so.origin} (sales module may be missing): ${String(err)}`);
        }
      } else {
        console.log(`  ⏭️ Skipped Sales Order (Already exists): ${so.origin}`);
      }
    }

    console.log('\n7. Creating Sample MRP Orders...');
    const mrpOrders = [
      { origin: 'DEMO-MRP-1', productIndex: 0, qty: 10 },
      { origin: 'DEMO-MRP-2', productIndex: 1, qty: 5 }
    ];
    for (const mrp of mrpOrders) {
      const existing = await execute(uid, 'mrp.production', 'search', [[['origin', '=', mrp.origin]]]);
      if (existing.length === 0) {
        try {
          const mrpId = await execute(uid, 'mrp.production', 'create', [{
            origin: mrp.origin,
            product_id: productIds[mrp.productIndex],
            product_qty: mrp.qty
          }]);
          console.log(`  ➕ Created MRP Order: ${mrp.origin} (ID: ${mrpId})`);
        } catch (err) {
          console.log(`  ⚠️ Skipped MRP Order ${mrp.origin} (MRP module may be missing): ${String(err)}`);
        }
      } else {
        console.log(`  ⏭️ Skipped MRP Order (Already exists): ${mrp.origin}`);
      }
    }

    console.log('\n✅ GRAND ODOO SEEDING COMPLETE! You can now view the data in the Dashboard.');
  } catch (error) {
    console.error('\n❌ SEEDING FAILED:', error);
    process.exit(1);
  }
}

run();
