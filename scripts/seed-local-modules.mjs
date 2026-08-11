/**
 * seed-local-modules.mjs
 * Seeds the 4 local module databases mirroring Neon's per-domain architecture:
 *   addiscrown_accounting_local     → Accounting module (chart_of_accounts, journal_entries, vendor_bills, customer_invoices)
 *   addiscrown_procurement_local    → Procurement module (suppliers, purchase_orders, warehouse_receipts)
 *   addiscrown_analytics_local      → Analytics module (sales_analytics, warehouse_metrics, inventory_products, inventory_transactions)
 *   addiscrown_tenantfinance_local  → Tenant Finance module (customers, sales_orders, crm_opportunities)
 *
 * Run from repo root:
 *   node scripts/seed-local-modules.mjs
 */

import pg from 'pg';
const { Pool } = pg;

const TENANT = 'tenant_default';

// Local connection strings for each module database
const MODULE_DBS = {
  accounting: 'postgresql://ja:localdev@127.0.0.1:5432/addiscrown_accounting_local',
  procurement: 'postgresql://ja:localdev@127.0.0.1:5432/addiscrown_procurement_local',
  analytics: 'postgresql://ja:localdev@127.0.0.1:5432/addiscrown_analytics_local',
  tenantfinance: 'postgresql://ja:localdev@127.0.0.1:5432/addiscrown_tenantfinance_local'
};

const pools = {};
for (const [name, url] of Object.entries(MODULE_DBS)) {
  pools[name] = new Pool({
    connectionString: url,
    ssl: false,
    max: 2,
    connectionTimeoutMillis: 15000,
  });
}

async function run(pool, label, sql, params = []) {
  try {
    await pool.query(sql, params);
    console.log(`  ✅ ${label}`);
  } catch (e) {
    console.error(`  ❌ ${label}: ${e.message}`);
  }
}

async function seedAccounting() {
  const pool = pools.accounting;
  console.log('\n📊 Seeding ACCOUNTING module (addiscrown_accounting_local)');
  console.log('─'.repeat(60));

  // chart_of_accounts
  await run(pool, 'Create chart_of_accounts', `
    CREATE TABLE IF NOT EXISTS chart_of_accounts (
      id SERIAL PRIMARY KEY, account_code VARCHAR(50) UNIQUE NOT NULL,
      account_name VARCHAR(255) NOT NULL, account_type VARCHAR(50),
      balance_type VARCHAR(10), is_active BOOLEAN DEFAULT true,
      tenant_id VARCHAR(50) DEFAULT 'tenant_default',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

  // journal_entries
  await run(pool, 'Create journal_entries', `
    CREATE TABLE IF NOT EXISTS journal_entries (
      id SERIAL PRIMARY KEY, entry_number VARCHAR(50) UNIQUE NOT NULL,
      entry_date DATE NOT NULL, entry_type VARCHAR(50), description TEXT,
      status VARCHAR(50), total_debit DECIMAL(15,2) DEFAULT 0,
      total_credit DECIMAL(15,2) DEFAULT 0, reference_type VARCHAR(50),
      reference_id VARCHAR(50), tenant_id VARCHAR(50) DEFAULT 'tenant_default',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

  // vendor_bills (from neonAgingQueries)
  await run(pool, 'Create vendor_bills', `
    CREATE TABLE IF NOT EXISTS vendor_bills (
      id SERIAL PRIMARY KEY, invoice_id VARCHAR(50) UNIQUE NOT NULL,
      vendor_name VARCHAR(255) NOT NULL, due_date DATE NOT NULL,
      amount DECIMAL(15,2) NOT NULL, currency VARCHAR(10) DEFAULT 'ETB',
      tenant_id VARCHAR(50) DEFAULT 'tenant_default',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

  // customer_invoices (from neonAgingQueries)
  await run(pool, 'Create customer_invoices', `
    CREATE TABLE IF NOT EXISTS customer_invoices (
      id SERIAL PRIMARY KEY, invoice_id VARCHAR(50) UNIQUE NOT NULL,
      customer_name VARCHAR(255) NOT NULL, due_date DATE NOT NULL,
      amount DECIMAL(15,2) NOT NULL, currency VARCHAR(10) DEFAULT 'ETB',
      tenant_id VARCHAR(50) DEFAULT 'tenant_default',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

  // Indexes for aging tables
  await run(pool, 'Create aging indexes', `
    CREATE INDEX IF NOT EXISTS idx_vendor_bills_tenant ON vendor_bills(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_vendor_bills_due_date ON vendor_bills(due_date);
    CREATE INDEX IF NOT EXISTS idx_customer_invoices_tenant ON customer_invoices(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_customer_invoices_due_date ON customer_invoices(due_date);`);

  // Seed data
  console.log('\n── Seeding accounting data ─────────────────────────────');
  
  await run(pool, 'Seed chart_of_accounts', `
    INSERT INTO chart_of_accounts (account_code, account_name, account_type, balance_type, tenant_id) VALUES
    ('1000','Cash and Cash Equivalents','Asset','debit',$1),
    ('1100','Petty Cash','Asset','debit',$1),
    ('1200','Accounts Receivable','Asset','debit',$1),
    ('1500','Inventory','Asset','debit',$1),
    ('2000','Accounts Payable','Liability','credit',$1),
    ('2100','VAT Payable','Liability','credit',$1),
    ('3000','Share Capital','Equity','credit',$1),
    ('4000','Sales Revenue','Revenue','credit',$1),
    ('4100','Service Revenue','Revenue','credit',$1),
    ('5000','Cost of Goods Sold','Expense','debit',$1),
    ('5100','Salaries Expense','Expense','debit',$1),
    ('5200','Rent Expense','Expense','debit',$1)
    ON CONFLICT (account_code) DO NOTHING`, [TENANT]);

  await run(pool, 'Seed journal_entries', `
    INSERT INTO journal_entries (entry_number, entry_date, entry_type, description, status, total_debit, total_credit, tenant_id) VALUES
    ('JE-0001', CURRENT_DATE,   'SALES_INVOICE', 'Sale to Bole Construction',     'posted', 550000,  550000,  $1),
    ('JE-0002', CURRENT_DATE-1, 'PURCHASE_ORDER','Purchase from Addis Crown',      'draft',  1085000, 1085000, $1),
    ('JE-0003', CURRENT_DATE-3, 'SALES_INVOICE', 'Sale to Megenagna Complex',      'posted', 2295000, 2295000, $1),
    ('JE-0004', CURRENT_DATE-5, 'PURCHASE_ORDER','Purchase from East Africa Glass','posted', 984000,  984000,  $1)
    ON CONFLICT (entry_number) DO NOTHING`, [TENANT]);

  await run(pool, 'Seed vendor_bills', `
    INSERT INTO vendor_bills (invoice_id, vendor_name, due_date, amount, tenant_id) VALUES
    ('VB-001','Addis Crown Materials Ltd', CURRENT_DATE+30, 1085000, $1),
    ('VB-002','Bekele Trading Export',     CURRENT_DATE+45, 1000000, $1),
    ('VB-003','East Africa Glass & Frames',CURRENT_DATE+15,  984000, $1)
    ON CONFLICT (invoice_id) DO NOTHING`, [TENANT]);

  await run(pool, 'Seed customer_invoices', `
    INSERT INTO customer_invoices (invoice_id, customer_name, due_date, amount, tenant_id) VALUES
    ('CI-001','Bole Construction',      CURRENT_DATE+30,  550000, $1),
    ('CI-002','Megenagna Complex',      CURRENT_DATE+15, 2295000, $1),
    ('CI-003','Kazanchis Office Tower', CURRENT_DATE+45,  984000, $1)
    ON CONFLICT (invoice_id) DO NOTHING`, [TENANT]);
}

async function seedProcurement() {
  const pool = pools.procurement;
  console.log('\n📦 Seeding PROCUREMENT module (addiscrown_procurement_local)');
  console.log('─'.repeat(60));

  // suppliers
  await run(pool, 'Create suppliers', `
    CREATE TABLE IF NOT EXISTS suppliers (
      id VARCHAR(50) PRIMARY KEY, supplier_code VARCHAR(50), name VARCHAR(255) NOT NULL,
      email VARCHAR(255), phone VARCHAR(50), city VARCHAR(100), country VARCHAR(100),
      active BOOLEAN DEFAULT true, tenant_id VARCHAR(50) DEFAULT 'tenant_default',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

  // purchase_orders
  await run(pool, 'Create purchase_orders', `
    CREATE TABLE IF NOT EXISTS purchase_orders (
      id SERIAL PRIMARY KEY, po_number VARCHAR(50) UNIQUE NOT NULL,
      supplier_id VARCHAR(50), supplier_name VARCHAR(255),
      po_date DATE NOT NULL, expected_delivery_date DATE,
      total_amount DECIMAL(15,2) NOT NULL, status VARCHAR(50) NOT NULL,
      notes TEXT, items JSONB, tenant_id VARCHAR(50) DEFAULT 'tenant_default',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

  // warehouse_receipts
  await run(pool, 'Create warehouse_receipts', `
    CREATE TABLE IF NOT EXISTS warehouse_receipts (
      id SERIAL PRIMARY KEY, receipt_number VARCHAR(50) UNIQUE NOT NULL,
      po_id VARCHAR(50), supplier_name VARCHAR(255), receipt_date DATE NOT NULL,
      status VARCHAR(50) NOT NULL, notes TEXT, items JSONB,
      tenant_id VARCHAR(50) DEFAULT 'tenant_default',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

  console.log('\n── Seeding procurement data ─────────────────────────────');

  await run(pool, 'Seed suppliers', `
    INSERT INTO suppliers (id, supplier_code, name, email, phone, city, country, tenant_id) VALUES
    ('sup-001','SUP-001','Addis Crown Materials Ltd','contact@addiscrown.et','+251-1-234-5678','Addis Ababa','Ethiopia',$1),
    ('sup-002','SUP-002','Bekele Trading Export','sales@bekeletrading.et','+251-1-555-9876','Addis Ababa','Ethiopia',$1),
    ('sup-003','SUP-003','East Africa Glass & Frames','proc@eaglass.ke','+254-20-222-3333','Nairobi','Kenya',$1),
    ('sup-004','SUP-004','Nile Logistics & Supply','orders@nilelogistics.et','+251-9-876-5432','Addis Ababa','Ethiopia',$1),
    ('sup-005','SUP-005','Red Sea Import Group','supply@redsea.sa','+966-1-411-2233','Riyadh','Saudi Arabia',$1)
    ON CONFLICT (id) DO NOTHING`, [TENANT]);

  await run(pool, 'Seed purchase_orders', `
    INSERT INTO purchase_orders (po_number, supplier_id, supplier_name, po_date, total_amount, status, tenant_id) VALUES
    ('PO-1001','sup-001','Addis Crown Materials Ltd', CURRENT_DATE-5, 1085000,'draft',$1),
    ('PO-1002','sup-002','Bekele Trading Export',     CURRENT_DATE-2, 1000000,'confirmed',$1),
    ('PO-1003','sup-003','East Africa Glass & Frames',CURRENT_DATE-1,  984000,'sent',$1)
    ON CONFLICT (po_number) DO NOTHING`, [TENANT]);

  await run(pool, 'Seed warehouse_receipts', `
    INSERT INTO warehouse_receipts (receipt_number, po_id, supplier_name, receipt_date, status, tenant_id) VALUES
    ('WR-001','PO-1001','Addis Crown Materials Ltd', CURRENT_DATE-3,'pending',$1),
    ('WR-002','PO-1002','Bekele Trading Export',     CURRENT_DATE-1,'matched',$1),
    ('WR-003','PO-1003','East Africa Glass & Frames',CURRENT_DATE,  'pending',$1)
    ON CONFLICT (receipt_number) DO NOTHING`, [TENANT]);
}

async function seedAnalytics() {
  const pool = pools.analytics;
  console.log('\n📈 Seeding ANALYTICS module (addiscrown_analytics_local)');
  console.log('─'.repeat(60));

  // sales_analytics (from setup-neon-tables.mjs)
  await run(pool, 'Create sales_analytics', `
    CREATE TABLE IF NOT EXISTS sales_analytics (
      id SERIAL PRIMARY KEY, order_id VARCHAR(50) UNIQUE NOT NULL,
      order_name VARCHAR(100) NOT NULL, state VARCHAR(50) NOT NULL,
      date_order DATE NOT NULL, amount_total DECIMAL(15,2) NOT NULL,
      currency VARCHAR(10) DEFAULT 'ETB', partner_id INTEGER,
      partner_name VARCHAR(255), tenant_id VARCHAR(50) DEFAULT 'production',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

  // warehouse_metrics (from setup-neon-tables.mjs)
  await run(pool, 'Create warehouse_metrics', `
    CREATE TABLE IF NOT EXISTS warehouse_metrics (
      id SERIAL PRIMARY KEY, picking_id VARCHAR(50) UNIQUE NOT NULL,
      picking_type VARCHAR(50) NOT NULL, state VARCHAR(50) NOT NULL,
      scheduled_date DATE NOT NULL, location_src VARCHAR(100),
      location_dest VARCHAR(100), tenant_id VARCHAR(50) DEFAULT 'production',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

  // inventory_products (from firebase-bridge.js sync-inventory action)
  await run(pool, 'Create inventory_products', `
    CREATE TABLE IF NOT EXISTS inventory_products (
      id SERIAL PRIMARY KEY, sku VARCHAR(100) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL, quantity INTEGER DEFAULT 0,
      unit_price DECIMAL(15,2) DEFAULT 0, tenant_id VARCHAR(50) DEFAULT 'tenant_default',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

  // inventory_transactions (for transaction history)
  await run(pool, 'Create inventory_transactions', `
    CREATE TABLE IF NOT EXISTS inventory_transactions (
      id SERIAL PRIMARY KEY, product_id VARCHAR(50), transaction_type VARCHAR(50),
      quantity DECIMAL(15,2) NOT NULL, unit_cost DECIMAL(15,2), location_id VARCHAR(50),
      reference_type VARCHAR(50), reference_id VARCHAR(50),
      transaction_date DATE NOT NULL, tenant_id VARCHAR(50) DEFAULT 'tenant_default',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

  // Indexes
  await run(pool, 'Create analytics indexes', `
    CREATE INDEX IF NOT EXISTS idx_sales_analytics_tenant ON sales_analytics(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_sales_analytics_state ON sales_analytics(state);
    CREATE INDEX IF NOT EXISTS idx_sales_analytics_date_order ON sales_analytics(date_order);
    CREATE INDEX IF NOT EXISTS idx_warehouse_metrics_tenant ON warehouse_metrics(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_warehouse_metrics_state ON warehouse_metrics(state);
    CREATE INDEX IF NOT EXISTS idx_warehouse_metrics_scheduled_date ON warehouse_metrics(scheduled_date);`);

  console.log('\n── Seeding analytics data ────────────────────────────────');

  // Seed sales_analytics (map from sales_orders)
  await run(pool, 'Seed sales_analytics', `
    INSERT INTO sales_analytics (order_id, order_name, state, date_order, amount_total, partner_id, partner_name, tenant_id) VALUES
    ('SO-ABC123','SO-ABC123','draft',    CURRENT_DATE-7,  550000, 1, 'Bole Construction',     'production'),
    ('SO-DEF456','SO-DEF456','confirmed', CURRENT_DATE-5, 2295000, 2, 'Megenagna Complex',     'production'),
    ('SO-GHI789','SO-GHI789','done',      CURRENT_DATE-3,  147000, 1, 'Bole Construction',     'production'),
    ('SO-JKL012','SO-JKL012','draft',     CURRENT_DATE-1,  984000, 3, 'Kazanchis Office Tower','production')
    ON CONFLICT (order_id) DO NOTHING`);

  // Seed warehouse_metrics
  await run(pool, 'Seed warehouse_metrics', `
    INSERT INTO warehouse_metrics (picking_id, picking_type, state, scheduled_date, location_src, location_dest, tenant_id) VALUES
    ('PK-001','delivery','ready',     CURRENT_DATE,   'WH/Stock', 'WH/Output', 'production'),
    ('PK-002','receipt', 'pending',   CURRENT_DATE+1, 'WH/Input', 'WH/Stock',  'production'),
    ('PK-003','internal','done',      CURRENT_DATE-2, 'WH/Stock', 'WH/Pack',   'production')
    ON CONFLICT (picking_id) DO NOTHING`);

  // Seed inventory_products (from products seed)
  await run(pool, 'Seed inventory_products', `
    INSERT INTO inventory_products (sku, name, quantity, unit_price, tenant_id) VALUES
    ('SKU-1001','Crown Glass 4mm',       80,  5200, 'tenant_default'),
    ('SKU-1002','Crown Glass 6mm',       40, 12500, 'tenant_default'),
    ('SKU-1003','Aluminum Frame 1.5m',   30,  1200, 'tenant_default'),
    ('SKU-1004','Steel Bracket Set',     25,   600, 'tenant_default')
    ON CONFLICT (sku) DO NOTHING`);

  // Seed inventory_transactions
  await run(pool, 'Seed inventory_transactions', `
    INSERT INTO inventory_transactions (product_id, transaction_type, quantity, unit_cost, transaction_date, tenant_id) VALUES
    ('prod-001','receipt',  100, 4200, CURRENT_DATE-3, 'tenant_default'),
    ('prod-002','receipt',   50,10500, CURRENT_DATE-3, 'tenant_default'),
    ('prod-003','receipt',   30,  800, CURRENT_DATE-2, 'tenant_default'),
    ('prod-001','issue',    -20, 4200, CURRENT_DATE-1, 'tenant_default'),
    ('prod-002','issue',    -10,10500, CURRENT_DATE,   'tenant_default')`);
}

async function seedTenantFinance() {
  const pool = pools.tenantfinance;
  console.log('\n💰 Seeding TENANT FINANCE module (addiscrown_tenantfinance_local)');
  console.log('─'.repeat(60));

  // customers
  await run(pool, 'Create customers', `
    CREATE TABLE IF NOT EXISTS customers (
      id SERIAL PRIMARY KEY, customer_code VARCHAR(50) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL, email VARCHAR(255), phone VARCHAR(50),
      city VARCHAR(100), country VARCHAR(100), credit_limit DECIMAL(15,2) DEFAULT 0,
      active BOOLEAN DEFAULT true, tenant_id VARCHAR(50) DEFAULT 'tenant_default',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

  // sales_orders
  await run(pool, 'Create sales_orders', `
    CREATE TABLE IF NOT EXISTS sales_orders (
      id SERIAL PRIMARY KEY, order_number VARCHAR(50) UNIQUE NOT NULL,
      customer_id VARCHAR(50), customer_name VARCHAR(255),
      order_date DATE NOT NULL, delivery_date DATE,
      total_amount DECIMAL(15,2) NOT NULL, status VARCHAR(50) NOT NULL,
      payment_status VARCHAR(50), notes TEXT, items JSONB,
      tenant_id VARCHAR(50) DEFAULT 'tenant_default',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

  // crm_opportunities
  await run(pool, 'Create crm_opportunities', `
    CREATE TABLE IF NOT EXISTS crm_opportunities (
      id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, customer_name VARCHAR(255),
      expected_value DECIMAL(15,2) NOT NULL, status VARCHAR(50) NOT NULL,
      tenant_id VARCHAR(50) DEFAULT 'tenant_default',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

  console.log('\n── Seeding tenant finance data ────────────────────────────');

  await run(pool, 'Seed customers', `
    INSERT INTO customers (customer_code, name, email, phone, city, country, credit_limit, tenant_id) VALUES
    ('CUST-001','Bole Construction','billing@bole.et','+251-1-111-2222','Addis Ababa','Ethiopia',1000000,$1),
    ('CUST-002','Megenagna Complex','finance@megenagna.et','+251-1-333-4444','Addis Ababa','Ethiopia',5000000,$1),
    ('CUST-003','Kazanchis Office Tower','accounts@kazanchis.et','+251-1-555-6666','Addis Ababa','Ethiopia',2000000,$1)
    ON CONFLICT (customer_code) DO NOTHING`, [TENANT]);

  await run(pool, 'Seed sales_orders', `
    INSERT INTO sales_orders (order_number, customer_id, customer_name, order_date, total_amount, status, tenant_id) VALUES
    ('SO-ABC123','cust-001','Bole Construction',     CURRENT_DATE-7,  550000,'draft',$1),
    ('SO-DEF456','cust-002','Megenagna Complex',     CURRENT_DATE-5, 2295000,'confirmed',$1),
    ('SO-GHI789','cust-001','Bole Construction',     CURRENT_DATE-3,  147000,'done',$1),
    ('SO-JKL012','cust-003','Kazanchis Office Tower',CURRENT_DATE-1,  984000,'draft',$1)
    ON CONFLICT (order_number) DO NOTHING`, [TENANT]);

  await run(pool, 'Seed crm_opportunities', `
    INSERT INTO crm_opportunities (name, customer_name, expected_value, status, tenant_id) VALUES
    ('Glass Supply Q3 2026','Bole Construction',   150000,'prospecting',$1),
    ('Cement Supply Q3 2026','Megenagna Complex',  450000,'proposal',   $1),
    ('Frame Supply Contract','Kazanchis Tower',    220000,'qualification',$1)`, [TENANT]);
}

async function main() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('🌱 Addis Crown ERP — Local Module Databases Seeder');
  console.log('═══════════════════════════════════════════════════════════════\n');

  await seedAccounting();
  await seedProcurement();
  await seedAnalytics();
  await seedTenantFinance();

  // Close all pools
  for (const pool of Object.values(pools)) {
    await pool.end();
  }

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('✅ All 4 module databases seeded successfully!');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  console.log('📋 Summary of local module databases:');
  console.log('  • addiscrown_accounting_local     → chart_of_accounts, journal_entries, vendor_bills, customer_invoices');
  console.log('  • addiscrown_procurement_local    → suppliers, purchase_orders, warehouse_receipts');
  console.log('  • addiscrown_analytics_local      → sales_analytics, warehouse_metrics, inventory_products, inventory_transactions');
  console.log('  • addiscrown_tenantfinance_local  → customers, sales_orders, crm_opportunities');
}

main().catch(console.error);