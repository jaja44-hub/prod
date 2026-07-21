#!/usr/bin/env node
import pg from 'pg';
const { Client } = pg;

const OLD_DB_URL = 'postgresql://neondb_owner:npg_sUbwp0cAWdH3@ep-solitary-dew-auii1z3j.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const ACCOUNTING_DB_URL = 'postgresql://neondb_owner:npg_sUbwp0cAWdH3@ep-solitary-dew-auii1z3j.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function migrateTable(tableName) {
  console.log(`Migrating ${tableName}...`);
  
  const source = new Client({ connectionString: OLD_DB_URL });
  const target = new Client({ connectionString: ACCOUNTING_DB_URL });
  
  await source.connect();
  await target.connect();
  
  const { rows } = await source.query(`SELECT * FROM ${tableName}`);
  console.log(`  Found ${rows.length} rows`);
  
  if (rows.length > 0) {
    const columns = Object.keys(rows[0]);
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
    const colNames = columns.join(', ');
    
    for (const row of rows) {
      const values = columns.map(col => row[col]);
      try {
        await target.query(
          `INSERT INTO ${tableName} (${colNames}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
          values
        );
      } catch (err) {
        console.log(`  Warning: ${err.message}`);
      }
    }
  }
  
  await source.end();
  await target.end();
  console.log(`  ✓ ${tableName} migrated`);
}

async function main() {
  console.log('Starting accounting data migration...\n');
  
  await migrateTable('accounts');
  await migrateTable('journal_entries');
  await migrateTable('payment_batches');
  await migrateTable('tax_transactions');
  
  console.log('\n✅ Accounting data migration complete!');
}

main().catch(console.error);
