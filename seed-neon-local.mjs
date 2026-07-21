/**
 * seed-neon-local.mjs
 * Run directly from your machine: node seed-neon-local.mjs
 * Set DATABASE_URL env variable before running, e.g.:
 *   DATABASE_URL="postgresql://..." node seed-neon-local.mjs
 */

import pg from 'pg';
const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌ Set DATABASE_URL before running this script.');
  console.error('   Example: DATABASE_URL="postgresql://..." node seed-neon-local.mjs');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 2,
  connectionTimeoutMillis: 15000,
});

const TENANT = 'tenant_default';

async function run(label, sql, params = []) {
  try {
    await pool.query(sql, params);
    console.log(`  ✅ ${label}`);
  } catch (e) {
    console.error(`  ❌ ${label}: ${e.message}`);
  }
}

async function main() {
  console.log('\n══════════════════════════════════════════════════════');
  console.log('🌱 Addis Crown ERP — Neon DB Local Seeder');
  console.log('══════════════════════════════════════════════════════\n');

  // ── TABLES ──────────────────────────────────────────────────────
  await run('Create suppliers', `
    CREATE TABLE IF NOT EXISTS suppliers (
      id VARCHAR(50) PRIMARY KEY, supplier_code VARCHAR(50), name VARCHAR(255) NOT NULL,
      email VARCHAR(255), phone VARCHAR(50), city VARCHAR(100), country VARCHAR(100),
      active BOOLEAN DEFAULT true, tenant_id VARCHAR(50) DEFAULT 'tenant_default',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

  await run('Create purchase_orders', `
    CREATE TABLE IF NOT EXISTS purchase_orders (
      id SERIAL PRIMARY KEY, po_number VARCHAR(50) UNIQUE NOT NULL,
      supplier_id VARCHAR(50), supplier_name VARCHAR(255),
      po_date DATE NOT NULL, expected_delivery_date DATE,
      total_amount DECIMAL(15,2) NOT NULL, status VARCHAR(50) NOT NULL,
      notes TEXT, items JSONB, tenant_id VARCHAR(50) DEFAULT 'tenant_default',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

  await run('Create sales_orders', `
    CREATE TABLE IF NOT EXISTS sales_orders (
      id SERIAL PRIMARY KEY, order_number VARCHAR(50) UNIQUE NOT NULL,
      customer_id VARCHAR(50), customer_name VARCHAR(255),
      order_date DATE NOT NULL, delivery_date DATE,
      total_amount DECIMAL(15,2) NOT NULL, status VARCHAR(50) NOT NULL,
      payment_status VARCHAR(50), notes TEXT, items JSONB,
      tenant_id VARCHAR(50) DEFAULT 'tenant_default',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

  await run('Create chart_of_accounts', `
    CREATE TABLE IF NOT EXISTS chart_of_accounts (
      id SERIAL PRIMARY KEY, account_code VARCHAR(50) UNIQUE NOT NULL,
      account_name VARCHAR(255) NOT NULL, account_type VARCHAR(50),
      balance_type VARCHAR(10), is_active BOOLEAN DEFAULT true,
      tenant_id VARCHAR(50) DEFAULT 'tenant_default',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

  await run('Create journal_entries', `
    CREATE TABLE IF NOT EXISTS journal_entries (
      id SERIAL PRIMARY KEY, entry_number VARCHAR(50) UNIQUE NOT NULL,
      entry_date DATE NOT NULL, entry_type VARCHAR(50), description TEXT,
      status VARCHAR(50), total_debit DECIMAL(15,2) DEFAULT 0,
      total_credit DECIMAL(15,2) DEFAULT 0, reference_type VARCHAR(50),
      reference_id VARCHAR(50), tenant_id VARCHAR(50) DEFAULT 'tenant_default',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

  await run('Create customers', `
    CREATE TABLE IF NOT EXISTS customers (
      id SERIAL PRIMARY KEY, customer_code VARCHAR(50) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL, email VARCHAR(255), phone VARCHAR(50),
      city VARCHAR(100), country VARCHAR(100), credit_limit DECIMAL(15,2) DEFAULT 0,
      active BOOLEAN DEFAULT true, tenant_id VARCHAR(50) DEFAULT 'tenant_default',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

  await run('Create warehouse_receipts', `
    CREATE TABLE IF NOT EXISTS warehouse_receipts (
      id SERIAL PRIMARY KEY, receipt_number VARCHAR(50) UNIQUE NOT NULL,
      po_id VARCHAR(50), supplier_name VARCHAR(255), receipt_date DATE NOT NULL,
      status VARCHAR(50) NOT NULL, notes TEXT, items JSONB,
      tenant_id VARCHAR(50) DEFAULT 'tenant_default',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

  await run('Create products', `
    CREATE TABLE IF NOT EXISTS products (
      id VARCHAR(50) PRIMARY KEY, sku VARCHAR(100) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL, cost_price DECIMAL(15,2) DEFAULT 0,
      selling_price DECIMAL(15,2) DEFAULT 0, reorder_level INTEGER DEFAULT 10,
      active BOOLEAN DEFAULT true, tenant_id VARCHAR(50) DEFAULT 'tenant_default',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

  await run('Create inventory_transactions', `
    CREATE TABLE IF NOT EXISTS inventory_transactions (
      id SERIAL PRIMARY KEY, product_id VARCHAR(50), transaction_type VARCHAR(50),
      quantity DECIMAL(15,2) NOT NULL, unit_cost DECIMAL(15,2), location_id VARCHAR(50),
      reference_type VARCHAR(50), reference_id VARCHAR(50),
      transaction_date DATE NOT NULL, tenant_id VARCHAR(50) DEFAULT 'tenant_default',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

  await run('Create crm_opportunities', `
    CREATE TABLE IF NOT EXISTS crm_opportunities (
      id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, customer_name VARCHAR(255),
      expected_value DECIMAL(15,2) NOT NULL, status VARCHAR(50) NOT NULL,
      tenant_id VARCHAR(50) DEFAULT 'tenant_default',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

  // ── SEED DATA ────────────────────────────────────────────────────
  console.log('\n── Seeding data ──────────────────────────────────────');

  await run('Seed suppliers', `
    INSERT INTO suppliers (id, supplier_code, name, email, phone, city, country, tenant_id) VALUES
    ('sup-001','SUP-001','Addis Crown Materials Ltd','contact@addiscrown.et','+251-1-234-5678','Addis Ababa','Ethiopia',$1),
    ('sup-002','SUP-002','Bekele Trading Export','sales@bekeletrading.et','+251-1-555-9876','Addis Ababa','Ethiopia',$1),
    ('sup-003','SUP-003','East Africa Glass & Frames','proc@eaglass.ke','+254-20-222-3333','Nairobi','Kenya',$1),
    ('sup-004','SUP-004','Nile Logistics & Supply','orders@nilelogistics.et','+251-9-876-5432','Addis Ababa','Ethiopia',$1),
    ('sup-005','SUP-005','Red Sea Import Group','supply@redsea.sa','+966-1-411-2233','Riyadh','Saudi Arabia',$1)
    ON CONFLICT (id) DO NOTHING`, [TENANT]);

  await run('Seed purchase_orders', `
    INSERT INTO purchase_orders (po_number, supplier_id, supplier_name, po_date, total_amount, status, tenant_id) VALUES
    ('PO-1001','sup-001','Addis Crown Materials Ltd', CURRENT_DATE-5, 1085000,'draft',$1),
    ('PO-1002','sup-002','Bekele Trading Export',     CURRENT_DATE-2, 1000000,'confirmed',$1),
    ('PO-1003','sup-003','East Africa Glass & Frames',CURRENT_DATE-1,  984000,'sent',$1)
    ON CONFLICT (po_number) DO NOTHING`, [TENANT]);

  await run('Seed sales_orders', `
    INSERT INTO sales_orders (order_number, customer_id, customer_name, order_date, total_amount, status, tenant_id) VALUES
    ('SO-ABC123','cust-001','Bole Construction',     CURRENT_DATE-7,  550000,'draft',$1),
    ('SO-DEF456','cust-002','Megenagna Complex',     CURRENT_DATE-5, 2295000,'confirmed',$1),
    ('SO-GHI789','cust-001','Bole Construction',     CURRENT_DATE-3,  147000,'done',$1),
    ('SO-JKL012','cust-003','Kazanchis Office Tower',CURRENT_DATE-1,  984000,'draft',$1)
    ON CONFLICT (order_number) DO NOTHING`, [TENANT]);

  await run('Seed chart_of_accounts', `
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

  await run('Seed journal_entries', `
    INSERT INTO journal_entries (entry_number, entry_date, entry_type, description, status, total_debit, total_credit, tenant_id) VALUES
    ('JE-0001', CURRENT_DATE,   'SALES_INVOICE', 'Sale to Bole Construction',     'posted', 550000,  550000,  $1),
    ('JE-0002', CURRENT_DATE-1, 'PURCHASE_ORDER','Purchase from Addis Crown',      'draft',  1085000, 1085000, $1),
    ('JE-0003', CURRENT_DATE-3, 'SALES_INVOICE', 'Sale to Megenagna Complex',      'posted', 2295000, 2295000, $1),
    ('JE-0004', CURRENT_DATE-5, 'PURCHASE_ORDER','Purchase from East Africa Glass','posted', 984000,  984000,  $1)
    ON CONFLICT (entry_number) DO NOTHING`, [TENANT]);

  await run('Seed customers', `
    INSERT INTO customers (customer_code, name, email, phone, city, country, credit_limit, tenant_id) VALUES
    ('CUST-001','Bole Construction','billing@bole.et','+251-1-111-2222','Addis Ababa','Ethiopia',1000000,$1),
    ('CUST-002','Megenagna Complex','finance@megenagna.et','+251-1-333-4444','Addis Ababa','Ethiopia',5000000,$1),
    ('CUST-003','Kazanchis Office Tower','accounts@kazanchis.et','+251-1-555-6666','Addis Ababa','Ethiopia',2000000,$1)
    ON CONFLICT (customer_code) DO NOTHING`, [TENANT]);

  await run('Seed warehouse_receipts', `
    INSERT INTO warehouse_receipts (receipt_number, po_id, supplier_name, receipt_date, status, tenant_id) VALUES
    ('WR-001','PO-1001','Addis Crown Materials Ltd', CURRENT_DATE-3,'pending',$1),
    ('WR-002','PO-1002','Bekele Trading Export',     CURRENT_DATE-1,'matched',$1),
    ('WR-003','PO-1003','East Africa Glass & Frames',CURRENT_DATE,  'pending',$1)
    ON CONFLICT (receipt_number) DO NOTHING`, [TENANT]);

  await run('Seed products', `
    INSERT INTO products (id, sku, name, cost_price, selling_price, reorder_level, tenant_id) VALUES
    ('prod-001','SKU-1001','Crown Glass 4mm',  4200, 5200, 20, $1),
    ('prod-002','SKU-1002','Crown Glass 6mm', 10500,12500, 10, $1),
    ('prod-003','SKU-1003','Aluminum Frame 1.5m', 800, 1200, 15, $1),
    ('prod-004','SKU-1004','Steel Bracket Set',  350,  600, 25, $1)
    ON CONFLICT (sku) DO NOTHING`, [TENANT]);

  await run('Seed inventory_transactions', `
    INSERT INTO inventory_transactions (product_id, transaction_type, quantity, unit_cost, transaction_date, tenant_id) VALUES
    ('prod-001','receipt',  100, 4200, CURRENT_DATE-3, $1),
    ('prod-002','receipt',   50,10500, CURRENT_DATE-3, $1),
    ('prod-003','receipt',   30,  800, CURRENT_DATE-2, $1),
    ('prod-001','issue',    -20, 4200, CURRENT_DATE-1, $1),
    ('prod-002','issue',    -10,10500, CURRENT_DATE,   $1)`, [TENANT]);

  await run('Seed crm_opportunities', `
    INSERT INTO crm_opportunities (name, customer_name, expected_value, status, tenant_id) VALUES
    ('Glass Supply Q3 2026','Bole Construction',   150000,'prospecting',$1),
    ('Cement Supply Q3 2026','Megenagna Complex',  450000,'proposal',   $1),
    ('Frame Supply Contract','Kazanchis Tower',    220000,'qualification',$1)`, [TENANT]);

  await pool.end();

  console.log('\n══════════════════════════════════════════════════════');
  console.log('✅ Seeding complete! All ERP tables created & populated.');
  console.log('══════════════════════════════════════════════════════\n');
}

main().catch(async (e) => {
  console.error('Fatal error:', e.message);
  await pool.end();
  process.exit(1);
});
