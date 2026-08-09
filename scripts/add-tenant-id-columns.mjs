#!/usr/bin/env node
import pg from 'pg';
const { Client } = pg;

const DB_URL = process.env.NEON_ACCOUNTING_DB_URL || process.env.NEONACCOUNTINGDBURL;
if (!DB_URL) {
  console.error('Set NEON_ACCOUNTING_DB_URL in .env.local before running this script (no hardcoded credentials).');
  process.exit(1);
}

async function addTenantIdColumns() {
  const client = new Client({ connectionString: DB_URL });
  await client.connect();

  try {
    console.log('Adding tenant_id columns to existing tables...\n');

    // Add tenant_id to employees table
    try {
      await client.query(`ALTER TABLE employees ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(100) DEFAULT 'tenant_default'`);
      console.log('✓ Added tenant_id to employees table');
    } catch (err) {
      console.log('Note: employees table may already have tenant_id:', err.message);
    }

    // Add tenant_id to sales_orders table
    try {
      await client.query(`ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(100) DEFAULT 'tenant_default'`);
      console.log('✓ Added tenant_id to sales_orders table');
    } catch (err) {
      console.log('Note: sales_orders table may already have tenant_id:', err.message);
    }

    // Add tenant_id to crm_opportunities table
    try {
      await client.query(`ALTER TABLE crm_opportunities ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(100) DEFAULT 'tenant_default'`);
      console.log('✓ Added tenant_id to crm_opportunities table');
    } catch (err) {
      console.log('Note: crm_opportunities table may already have tenant_id:', err.message);
    }

    await client.end();
    console.log('\n✅ tenant_id columns added successfully!');
  } catch (error) {
    console.error('Error:', error);
    await client.end();
    process.exit(1);
  }
}

addTenantIdColumns();
