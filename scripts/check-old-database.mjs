#!/usr/bin/env node
import pg from 'pg';
const { Client } = pg;

const OLD_DB_URL = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;

if (!OLD_DB_URL) {
  console.error('Set NEON_DATABASE_URL in .env.local before running this script (no hardcoded credentials).');
  process.exit(1);
}

async function checkTables() {
  const client = new Client({ connectionString: OLD_DB_URL });
  await client.connect();
  
  const res = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name
  `);
  
  console.log('Tables in old database:');
  for (const row of res.rows) {
    console.log(`  - ${row.table_name}`);
  }
  
  await client.end();
}

checkTables().catch(console.error);
