#!/usr/bin/env node
import pg from 'pg';
const { Client } = pg;

const PROCUREMENT_DB_URL = 'postgresql://neondb_owner:npg_gt5VHKpS8RDk@ep-red-dust-avdqp1ld.c-11.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function fixSchema() {
  const client = new Client({ connectionString: PROCUREMENT_DB_URL });
  await client.connect();
  
  console.log('Fixing procurement schema...');
  
  // Drop and recreate budget_variance with correct period type
  await client.query('DROP TABLE IF EXISTS budget_variance');
  
  await client.query(`
    CREATE TABLE budget_variance (
      id SERIAL PRIMARY KEY,
      budget_id INTEGER,
      actual_amount DECIMAL(15,2),
      budgeted_amount DECIMAL(15,2),
      variance DECIMAL(15,2),
      period VARCHAR(7),
      tenant_id VARCHAR(100) DEFAULT 'tenant_default'
    )
  `);
  
  await client.end();
  console.log('✓ Schema fixed');
}

fixSchema().catch(console.error);
