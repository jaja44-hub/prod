#!/usr/bin/env node
import pg from 'pg';
const { Client } = pg;

const OLD_DB_URL = 'postgresql://neondb_owner:npg_sUbwp0cAWdH3@ep-solitary-dew-auii1z3j.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

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
