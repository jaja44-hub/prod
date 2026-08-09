#!/usr/bin/env node
import pg from 'pg';
const { Client } = pg;

const ACCOUNTING_DB_URL = process.env.NEON_ACCOUNTING_DB_URL;
const PROCUREMENT_DB_URL = process.env.NEON_PROCUREMENT_DB_URL;
const ANALYTICS_DB_URL = process.env.NEON_ANALYTICS_DB_URL;
const TENANTFINANCE_DB_URL = process.env.NEON_TENANTFINANCE_DB_URL;

if (!ACCOUNTING_DB_URL || !PROCUREMENT_DB_URL || !ANALYTICS_DB_URL || !TENANTFINANCE_DB_URL) {
  console.error('Set NEON_ACCOUNTING/PROCUREMENT/ANALYTICS/TENANTFINANCE_DB_URL in .env.local before running this script (no hardcoded credentials).');
  process.exit(1);
}

async function migrateTable(tableName, sourceUrl, targetUrl) {
  console.log(`Migrating ${tableName}...`);
  const source = new Client({ connectionString: sourceUrl });
  const target = new Client({ connectionString: targetUrl });
  
  await source.connect();
  await target.connect();
  
  const { rows } = await source.query(`SELECT * FROM ${tableName}`);
  console.log(`  Found ${rows.length} rows`);
  
  if (rows.length > 0) {
    const columns = Object.keys(rows[0]);
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
    const values = columns.join(', ');
    
    for (const row of rows) {
      const valuesArr = columns.map(col => row[col]);
      await target.query(
        `INSERT INTO ${tableName} (${values}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
        valuesArr
      );
    }
  }
  
  await source.end();
  await target.end();
  console.log(`  ✓ ${tableName} migrated`);
}

async function main() {
  console.log('Starting multi-database migration...');
  
  // Accounting tables
  await migrateTable('journal_entries', ACCOUNTING_DB_URL, ACCOUNTING_DB_URL);
  await migrateTable('accounts', ACCOUNTING_DB_URL, ACCOUNTING_DB_URL);
  
  // Procurement tables
  await migrateTable('purchase_orders', PROCUREMENT_DB_URL, PROCUREMENT_DB_URL);
  await migrateTable('suppliers', PROCUREMENT_DB_URL, PROCUREMENT_DB_URL);
  
  // Analytics tables
  await migrateTable('inventory_products', ANALYTICS_DB_URL, ANALYTICS_DB_URL);
  await migrateTable('inventory_locations', ANALYTICS_DB_URL, ANALYTICS_DB_URL);
  
  console.log('Migration complete!');
}

main().catch(console.error);
