#!/usr/bin/env node
import pg from 'pg';
const { Client } = pg;

const DBS = {
  accounting: process.env.NEON_ACCOUNTING_DB_URL,
  procurement: process.env.NEON_PROCUREMENT_DB_URL,
  analytics: process.env.NEON_ANALYTICS_DB_URL,
  tenantfinance: process.env.NEON_TENANTFINANCE_DB_URL
};

if (Object.values(DBS).some((u) => !u)) {
  console.error('Set NEON_ACCOUNTING/PROCUREMENT/ANALYTICS/TENANTFINANCE_DB_URL in .env.local before running this script (no hardcoded credentials).');
  process.exit(1);
}

const ACCOUNTING_SCHEMA = [
  `CREATE TABLE IF NOT EXISTS journal_entries (
    id SERIAL PRIMARY KEY,
    entry_date DATE NOT NULL,
    entry_type VARCHAR(50) NOT NULL,
    debit_account_id INTEGER,
    credit_account_id INTEGER,
    amount DECIMAL(15,2) NOT NULL,
    description TEXT,
    reference_id VARCHAR(100),
    tenant_id VARCHAR(100) DEFAULT 'tenant_default',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS accounts (
    id SERIAL PRIMARY KEY,
    account_code VARCHAR(20) UNIQUE NOT NULL,
    account_name VARCHAR(200) NOT NULL,
    account_type VARCHAR(50) NOT NULL,
    parent_account_id INTEGER,
    balance DECIMAL(15,2) DEFAULT 0,
    tenant_id VARCHAR(100) DEFAULT 'tenant_default'
  )`,
  `CREATE TABLE IF NOT EXISTS tax_transactions (
    id SERIAL PRIMARY KEY,
    transaction_date DATE NOT NULL,
    tax_type VARCHAR(50) NOT NULL,
    tax_amount DECIMAL(15,2) NOT NULL,
    base_amount DECIMAL(15,2) NOT NULL,
    reference_id VARCHAR(100),
    tenant_id VARCHAR(100) DEFAULT 'tenant_default',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS payment_batches (
    id SERIAL PRIMARY KEY,
    batch_date DATE NOT NULL,
    total_amount DECIMAL(15,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    tenant_id VARCHAR(100) DEFAULT 'tenant_default',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`
];

const PROCUREMENT_SCHEMA = [
  `CREATE TABLE IF NOT EXISTS purchase_orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    supplier_id INTEGER,
    order_date DATE NOT NULL,
    expected_date DATE,
    total_amount DECIMAL(15,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'draft',
    tenant_id VARCHAR(100) DEFAULT 'tenant_default',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS purchase_requisitions (
    id SERIAL PRIMARY KEY,
    requisition_number VARCHAR(50) UNIQUE NOT NULL,
    requested_by VARCHAR(100),
    request_date DATE NOT NULL,
    total_amount DECIMAL(15,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    tenant_id VARCHAR(100) DEFAULT 'tenant_default',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(50),
    address TEXT,
    tenant_id VARCHAR(100) DEFAULT 'tenant_default'
  )`,
  `CREATE TABLE IF NOT EXISTS purchase_receipts (
    id SERIAL PRIMARY KEY,
    receipt_number VARCHAR(50) UNIQUE NOT NULL,
    purchase_order_id INTEGER,
    receipt_date DATE NOT NULL,
    quantity_received INTEGER,
    tenant_id VARCHAR(100) DEFAULT 'tenant_default',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS budget_variance (
    id SERIAL PRIMARY KEY,
    budget_id INTEGER,
    actual_amount DECIMAL(15,2),
    budgeted_amount DECIMAL(15,2),
    variance DECIMAL(15,2),
    period DATE,
    tenant_id VARCHAR(100) DEFAULT 'tenant_default'
  )`
];

const ANALYTICS_SCHEMA = [
  `CREATE TABLE IF NOT EXISTS inventory_products (
    id SERIAL PRIMARY KEY,
    sku VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    quantity INTEGER DEFAULT 0,
    unit_price DECIMAL(15,2),
    tenant_id VARCHAR(100) DEFAULT 'tenant_default'
  )`,
  `CREATE TABLE IF NOT EXISTS inventory_locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    location_type VARCHAR(50),
    address TEXT,
    tenant_id VARCHAR(100) DEFAULT 'tenant_default'
  )`,
  `CREATE TABLE IF NOT EXISTS inventory_transactions (
    id SERIAL PRIMARY KEY,
    product_id INTEGER,
    location_id INTEGER,
    transaction_type VARCHAR(50) NOT NULL,
    quantity INTEGER NOT NULL,
    transaction_date DATE NOT NULL,
    reference_id VARCHAR(100),
    tenant_id VARCHAR(100) DEFAULT 'tenant_default',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS inventory_cycle_counts (
    id SERIAL PRIMARY KEY,
    location_id INTEGER,
    count_date DATE NOT NULL,
    counted_by VARCHAR(100),
    status VARCHAR(50) DEFAULT 'pending',
    tenant_id VARCHAR(100) DEFAULT 'tenant_default',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`
];

const TENANTFINANCE_SCHEMA = [
  `CREATE TABLE IF NOT EXISTS tenant_subscriptions (
    id SERIAL PRIMARY KEY,
    tenant_id VARCHAR(100) UNIQUE NOT NULL,
    plan_type VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    monthly_fee DECIMAL(15,2),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS tenant_billing (
    id SERIAL PRIMARY KEY,
    tenant_id VARCHAR(100) NOT NULL,
    billing_period DATE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    due_date DATE,
    paid_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS tenant_usage_metrics (
    id SERIAL PRIMARY KEY,
    tenant_id VARCHAR(100) NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,2),
    recorded_at DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`
];

async function setupSchema(url, name, schema) {
  const client = new Client({ connectionString: url });
  await client.connect();
  console.log(`Setting up ${name} schema...`);
  for (const sql of schema) {
    try {
      await client.query(sql);
    } catch (err) {
      console.log(`  Warning: ${err.message}`);
    }
  }
  await client.end();
  console.log(`✓ ${name} schema complete`);
}

async function main() {
  console.log('Starting multi-database schema setup...\n');
  
  await setupSchema(DBS.accounting, 'Accounting DB', ACCOUNTING_SCHEMA);
  await setupSchema(DBS.procurement, 'Procurement DB', PROCUREMENT_SCHEMA);
  await setupSchema(DBS.analytics, 'Analytics DB', ANALYTICS_SCHEMA);
  await setupSchema(DBS.tenantfinance, 'Tenant Finance DB', TENANTFINANCE_SCHEMA);
  
  console.log('\n✅ All database schemas created successfully!');
}

main().catch(console.error);
