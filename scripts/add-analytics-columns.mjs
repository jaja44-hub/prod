#!/usr/bin/env node
import pg from 'pg';
const { Client } = pg;
const DB_URL = process.env.NEON_ANALYTICS_DB_URL;
if (!DB_URL) {
  console.error('Set NEON_ANALYTICS_DB_URL in .env.local before running this script (no hardcoded credentials).');
  process.exit(1);
}
async function addColumns() {
  const client = new Client({ connectionString: DB_URL });
  await client.connect();
  try {
    await client.query(`ALTER TABLE inventory_products ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
    await client.query(`ALTER TABLE inventory_products ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(100) DEFAULT 'tenant_default'`);
    await client.query(`ALTER TABLE inventory_locations ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
    await client.query(`ALTER TABLE inventory_locations ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(100) DEFAULT 'tenant_default'`);
    await client.query(`ALTER TABLE inventory_transactions ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(100) DEFAULT 'tenant_default'`);
    await client.query(`ALTER TABLE inventory_cycle_counts ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(100) DEFAULT 'tenant_default'`);
    console.log('✅ Columns added');
  } catch (e) { console.error(e); }
  await client.end();
}
addColumns();
