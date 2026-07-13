import { queryNeon } from '../server/api/lib/neonClient.js';
import xmlrpc from 'xmlrpc';

console.log('🔄 Session 5: Odoo to Neon Sync');
console.log('===============================\n');

// Odoo credentials
const ODOO_URL = process.env.ODOO_URL || 'https://jafiface-addis-crown-erp.hf.space/odoo';
const ODOO_DB = process.env.ODOO_DB || 'neondb';
const ODOO_USER = process.env.ODOO_USER || 'admin';
const ODOO_PASSWORD = process.env.ODOO_PASSWORD || 'admin';

// Helper to create XML-RPC client
const getClient = (path) => {
  const url = new URL(ODOO_URL);
  const options = {
    host: url.hostname,
    port: url.port || (url.protocol === 'https:' ? 443 : 80),
    path,
  };
  return url.protocol === 'https:' ? xmlrpc.createSecureClient(options) : xmlrpc.createClient(options);
};

// Authenticate with Odoo
async function authenticateOdoo() {
  const client = getClient('/xmlrpc/2/common');
  return new Promise((resolve, reject) => {
    client.methodCall('authenticate', [ODOO_DB, ODOO_USER, ODOO_PASSWORD, {}], (error, uid) => {
      if (error) reject(error);
      else resolve(uid);
    });
  });
}

// Execute Odoo method
async function executeKw(uid, model, method, args = [], kwargs = {}) {
  const client = getClient('/xmlrpc/2/object');
  return new Promise((resolve, reject) => {
    client.methodCall('execute_kw', [ODOO_DB, uid, ODOO_PASSWORD, model, method, args, kwargs], (error, value) => {
      if (error) reject(error);
      else resolve(value);
    });
  });
}

// Sync vendor bills (account.move with move_type = 'in_invoice')
async function syncVendorBills(uid) {
  console.log('📦 Syncing vendor bills...');
  
  const bills = await executeKw(uid, 'account.move', 'search_read', [
    [['move_type', '=', 'in_invoice']],
  ], {
    fields: ['name', 'partner_id', 'invoice_date', 'amount_total', 'currency_id'],
  });

  const vendorBills = bills.map(bill => ({
    invoiceId: bill.name,
    vendorName: bill.partner_id?.[1] || 'Unknown',
    dueDate: bill.invoice_date || new Date().toISOString().split('T')[0],
    amount: bill.amount_total || 0,
    currency: 'ETB',
  }));

  if (vendorBills.length === 0) {
    console.log('  ⚠️  No vendor bills found in Odoo');
    return 0;
  }

  const insertQuery = `
    INSERT INTO vendor_bills (invoice_id, vendor_name, due_date, amount, currency, tenant_id)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (invoice_id) 
    DO UPDATE SET 
      vendor_name = EXCLUDED.vendor_name,
      due_date = EXCLUDED.due_date,
      amount = EXCLUDED.amount,
      currency = EXCLUDED.currency,
      updated_at = CURRENT_TIMESTAMP;
  `;

  for (const bill of vendorBills) {
    await queryNeon(insertQuery, [
      bill.invoiceId,
      bill.vendorName,
      bill.dueDate,
      bill.amount,
      bill.currency,
      'production',
    ]);
  }

  console.log(`  ✅ Synced ${vendorBills.length} vendor bills`);
  return vendorBills.length;
}

// Sync customer invoices (account.move with move_type = 'out_invoice')
async function syncCustomerInvoices(uid) {
  console.log('📦 Syncing customer invoices...');
  
  const invoices = await executeKw(uid, 'account.move', 'search_read', [
    [['move_type', '=', 'out_invoice']],
  ], {
    fields: ['name', 'partner_id', 'invoice_date', 'amount_total', 'currency_id'],
  });

  const customerInvoices = invoices.map(invoice => ({
    invoiceId: invoice.name,
    customerName: invoice.partner_id?.[1] || 'Unknown',
    dueDate: invoice.invoice_date || new Date().toISOString().split('T')[0],
    amount: invoice.amount_total || 0,
    currency: 'ETB',
  }));

  if (customerInvoices.length === 0) {
    console.log('  ⚠️  No customer invoices found in Odoo');
    return 0;
  }

  const insertQuery = `
    INSERT INTO customer_invoices (invoice_id, customer_name, due_date, amount, currency, tenant_id)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (invoice_id) 
    DO UPDATE SET 
      customer_name = EXCLUDED.customer_name,
      due_date = EXCLUDED.due_date,
      amount = EXCLUDED.amount,
      currency = EXCLUDED.currency,
      updated_at = CURRENT_TIMESTAMP;
  `;

  for (const invoice of customerInvoices) {
    await queryNeon(insertQuery, [
      invoice.invoiceId,
      invoice.customerName,
      invoice.dueDate,
      invoice.amount,
      invoice.currency,
      'production',
    ]);
  }

  console.log(`  ✅ Synced ${customerInvoices.length} customer invoices`);
  return customerInvoices.length;
}

// Sync warehouse metrics (stock.picking)
async function syncWarehouseMetrics(uid) {
  console.log('📦 Syncing warehouse metrics...');
  
  const pickings = await executeKw(uid, 'stock.picking', 'search_read', [
    [],
  ], {
    fields: ['name', 'picking_type_id', 'state', 'scheduled_date', 'location_id', 'location_dest_id'],
  });

  const warehouseMetrics = pickings.map(picking => ({
    pickingId: picking.name,
    pickingType: picking.picking_type_id?.[1] || 'Unknown',
    state: picking.state || 'draft',
    scheduledDate: picking.scheduled_date || new Date().toISOString().split('T')[0],
    locationSrc: picking.location_id?.[1] || 'Unknown',
    locationDest: picking.location_dest_id?.[1] || 'Unknown',
  }));

  if (warehouseMetrics.length === 0) {
    console.log('  ⚠️  No warehouse pickings found in Odoo');
    return 0;
  }

  const insertQuery = `
    INSERT INTO warehouse_metrics (picking_id, picking_type, state, scheduled_date, location_src, location_dest, tenant_id)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (picking_id) 
    DO UPDATE SET 
      picking_type = EXCLUDED.picking_type,
      state = EXCLUDED.state,
      scheduled_date = EXCLUDED.scheduled_date,
      location_src = EXCLUDED.location_src,
      location_dest = EXCLUDED.location_dest,
      updated_at = CURRENT_TIMESTAMP;
  `;

  for (const metric of warehouseMetrics) {
    await queryNeon(insertQuery, [
      metric.pickingId,
      metric.pickingType,
      metric.state,
      metric.scheduledDate,
      metric.locationSrc,
      metric.locationDest,
      'production',
    ]);
  }

  console.log(`  ✅ Synced ${warehouseMetrics.length} warehouse metrics`);
  return warehouseMetrics.length;
}

// Sync sales analytics (sale.order)
async function syncSalesAnalytics(uid) {
  console.log('📦 Syncing sales analytics...');
  
  const orders = await executeKw(uid, 'sale.order', 'search_read', [
    [],
  ], {
    fields: ['name', 'state', 'date_order', 'amount_total', 'currency_id', 'partner_id'],
  });

  const salesAnalytics = orders.map(order => ({
    orderId: order.name,
    orderName: order.name,
    state: order.state || 'draft',
    dateOrder: order.date_order ? order.date_order.split(' ')[0] : new Date().toISOString().split('T')[0],
    amountTotal: order.amount_total || 0,
    currency: 'ETB',
    partnerId: order.partner_id?.[0] || null,
    partnerName: order.partner_id?.[1] || 'Unknown',
  }));

  if (salesAnalytics.length === 0) {
    console.log('  ⚠️  No sales orders found in Odoo');
    return 0;
  }

  const insertQuery = `
    INSERT INTO sales_analytics (order_id, order_name, state, date_order, amount_total, currency, partner_id, partner_name, tenant_id)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    ON CONFLICT (order_id) 
    DO UPDATE SET 
      order_name = EXCLUDED.order_name,
      state = EXCLUDED.state,
      date_order = EXCLUDED.date_order,
      amount_total = EXCLUDED.amount_total,
      currency = EXCLUDED.currency,
      partner_id = EXCLUDED.partner_id,
      partner_name = EXCLUDED.partner_name,
      updated_at = CURRENT_TIMESTAMP;
  `;

  for (const sale of salesAnalytics) {
    await queryNeon(insertQuery, [
      sale.orderId,
      sale.orderName,
      sale.state,
      sale.dateOrder,
      sale.amountTotal,
      sale.currency,
      sale.partnerId,
      sale.partnerName,
      'production',
    ]);
  }

  console.log(`  ✅ Synced ${salesAnalytics.length} sales orders`);
  return salesAnalytics.length;
}

async function main() {
  try {
    console.log('🔐 Authenticating with Odoo...');
    const uid = await authenticateOdoo();
    if (!uid) {
      throw new Error('Odoo authentication failed');
    }
    console.log(`  ✅ Authenticated as user ID: ${uid}\n`);

    let totalSynced = 0;

    totalSynced += await syncVendorBills(uid);
    totalSynced += await syncCustomerInvoices(uid);
    totalSynced += await syncWarehouseMetrics(uid);
    totalSynced += await syncSalesAnalytics(uid);

    console.log('\n' + '='.repeat(60));
    console.log('📋 SYNC SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total records synced: ${totalSynced}`);
    console.log('='.repeat(60) + '\n');
    console.log('✅ Odoo to Neon sync complete\n');
  } catch (error) {
    console.error('\n❌ Sync failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
