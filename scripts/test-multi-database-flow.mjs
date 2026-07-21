#!/usr/bin/env node
import pg from 'pg';
const { Client } = pg;

const DBS = {
  accounting: 'postgresql://neondb_owner:npg_sUbwp0cAWdH3@ep-solitary-dew-auii1z3j.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  procurement: 'postgresql://neondb_owner:npg_gt5VHKpS8RDk@ep-red-dust-avdqp1ld.c-11.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  analytics: 'postgresql://neondb_owner:npg_7QnYZpGf6PAo@ep-silent-breeze-auk7is8u.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  tenantfinance: 'postgresql://neondb_owner:npg_0bBxKfP6ZVaE@ep-sparkling-voice-au9j0rv1.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
};

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
