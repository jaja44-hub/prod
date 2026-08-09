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

async function testDatabase(dbName, connectionString) {
  const client = new Client({ connectionString });
  await client.connect();
  
  try {
    const result = await client.query('SELECT NOW() as current_time');
    console.log(`✓ ${dbName}: Connected at ${result.rows[0].current_time}`);
    
    // Test table existence
    const tables = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    console.log(`  Tables: ${tables.rows.map(r => r.table_name).join(', ')}`);
    
    // Test data count
    for (const table of tables.rows.slice(0, 3)) {
      try {
        const count = await client.query(`SELECT COUNT(*) as cnt FROM ${table.table_name}`);
        console.log(`  ${table.table_name}: ${count.rows[0].cnt} records`);
      } catch (err) {
        console.log(`  ${table.table_name}: Unable to count`);
      }
    }
  } finally {
    await client.end();
  }
}

async function testFlow() {
  console.log('Testing multi-database data flow...\n');
  
  for (const [dbName, connectionString] of Object.entries(DBS)) {
    await testDatabase(dbName, connectionString);
    console.log();
  }
  
  console.log('✅ Multi-database flow test complete!');
}

testFlow().catch(console.error);
