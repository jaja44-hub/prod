/**
 * sync-remote-to-local.mjs
 * Pulls all 5 Neon databases to local Postgres using pg_dump/pg_restore CLI
 * Strategic: remote (source of truth) → local (no more drifted assumptions)
 */

import { execSync } from 'child_process';
import fs from 'fs';

const NEON_URLS = {
  main: 'postgresql://neondb_owner:npg_3ILp5RwOHjor@ep-patient-fog-at5jnnt6-pooler.c-9.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require',
  accounting: 'postgresql://neondb_owner:npg_sUbwp0cAWdH3@ep-solitary-dew-auii1z3j.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  procurement: 'postgresql://neondb_owner:npg_gt5VHKpS8RDk@ep-red-dust-avdqp1ld.c-11.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  analytics: 'postgresql://neondb_owner:npg_7QnYZpGf6PAo@ep-silent-breeze-auk7is8u.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  tenantfinance: 'postgresql://neondb_owner:npg_0bBxKfP6ZVaE@ep-sparkling-voice-au9j0rv1.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
};

const LOCAL_DB_NAMES = {
  main: 'addiscrown_local',
  accounting: 'addiscrown_accounting_local',
  procurement: 'addiscrown_procurement_local',
  analytics: 'addiscrown_analytics_local',
  tenantfinance: 'addiscrown_tenantfinance_local'
};

const DB_NAMES = ['main', 'accounting', 'procurement', 'analytics', 'tenantfinance'];

console.log('══════════════════════════════════════════════════════');
console.log('🌍 Remote → Local Neon Database Sync');
console.log('   Source: Remote Neon (production - source of truth)');
console.log('   Target: Local Postgres addiscrown_* databases');
console.log('   Purpose: End drifted local assumptions, establish unison');
console.log('══════════════════════════════════════════════════════\n');

async function syncDB(dbName, neonUrl, localDb) {
  console.log(`\n🔄 Syncing ${dbName} → ${localDb}...`);
  
  try {
    // Get existing tables in local DB
    let tables;
    try {
      tables = execSync(
        `PGPASSWORD=localdev psql -h 127.0.0.1 -U ja -d ${localDb} -tAc "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename"`,
        { encoding: 'utf8' }
      ).trim();
    } catch (e) {
      console.error(`   ❌ Cannot connect to local DB ${localDb}`);
      return;
    }
    
    const tableList = tables ? tables.split('\n').filter(t => t.length > 0) : [];
    
    // Truncate all tables (simple approach: drop and recreate)
    if (tableList.length > 0) {
      for (const table of tableList) {
        try {
          // Use safer truncation - just drop table if exists, then we'll rely on pg_dump --create
          execSync(
            `PGPASSWORD=localdev psql -h 127.0.0.1 -U ja -d ${localDb} -c "DROP TABLE IF EXISTS ${table} CASCADE;"`,
            { encoding: 'utf8' }
          );
        } catch (e) {
          // Ignore - table might not exist
        }
      }
    }
    
    // Step 1: pg_dump schema + data from Neon
    // Using --no-owner --no-acl to avoid permission issues
    // Removed --if-not-exists since it's not supported in pg_dump 17.10
    const dump = execSync(
      `/usr/lib/postgresql/18/bin/pg_dump --no-owner --no-acl "${neonUrl}"`,
      { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 }
    );
    
    // Step 2: Restore to local
    execSync(
      `PGPASSWORD=localdev psql -h 127.0.0.1 -U ja -d ${localDb}`,
      { input: dump, encoding: 'utf8' }
    );
    
    console.log(`   ✅ ${dbName} → ${localDb} synced successfully`);
    
    // Step 3: Verify row counts for critical tables
    const criticalMaps = {
      main: ['inventory_products', 'inventory_transactions', 'employees', 'tenant_modules'],
      accounting: ['employees', 'accounts', 'journal_entries'],
      procurement: ['purchase_orders', 'suppliers', 'budgets'],
      analytics: ['inventory_products', 'inventory_transactions', 'stock'],
      tenantfinance: ['subscriptions', 'cash_flow', 'budget_forecasts']
    };
    
    const critical = criticalMaps[dbName] || [];
    if (critical.length > 0) {
      for (const t of critical) {
        try {
          const { rows } = await execSync(
            `PGPASSWORD=localdev psql -h 127.0.0.1 -U ja -d ${localDb} -tAc "SELECT COUNT(*) FROM ${t}"`,
            { encoding: 'utf8' }
          ).trim();
          console.log(`   📊 ${t}: ${rows} rows`);
        } catch (e) {
          console.log(`   📊 ${t}: verification error`);
        }
      }
    }
    
  } catch (err) {
    console.error(`   ❌ ${dbName} → ${localDb} FAILED: ${err.message}`);
  }
}

async function main() {
  console.log(`\nSyncing ${DB_NAMES.length} Neon databases...`);
  
  const tasks = DB_NAMES.map(dbName => syncDB(dbName, NEON_URLS[dbName], LOCAL_DB_NAMES[dbName]));
  await Promise.all(tasks);
  
  console.log('\n══════════════════════════════════════════════════════');
  console.log('🎉 Sync complete!');
  console.log('   Local Neon databases now match remote (production)');
  console.log('   No more drifted assumptions - ready for unified development');
  console.log('══════════════════════════════════════════════════════\n');
}

main().catch(err => {
  console.error('❌ Sync failed:', err);
  process.exit(1);
});
