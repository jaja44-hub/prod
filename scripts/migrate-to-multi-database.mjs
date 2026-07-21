#!/usr/bin/env node
import pg from 'pg';
const { Client } = pg;

const ACCOUNTING_DB_URL = 'postgresql://neondb_owner:npg_sUbwp0cAWdH3@ep-solitary-dew-auii1z3j.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const PROCUREMENT_DB_URL = 'postgresql://neondb_owner:npg_gt5VHKpS8RDk@ep-red-dust-avdqp1ld.c-11.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const ANALYTICS_DB_URL = 'postgresql://neondb_owner:npg_7QnYZpGf6PAo@ep-silent-breeze-auk7is8u.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const TENANTFINANCE_DB_URL = 'postgresql://neondb_owner:npg_0bBxKfP6ZVaE@ep-sparkling-voice-au9j0rv1.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

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
