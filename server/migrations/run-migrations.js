/**
 * Database Migration Runner
 * Executes SQL migration files in order to set up the database schema
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

console.log('DATABASE_URL:', process.env.DATABASE_URL);
console.log('DATABASE_URL type:', typeof process.env.DATABASE_URL);

// Database connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

/**
 * Read migration file content
 */
function readMigrationFile(filename) {
  const migrationPath = path.join(__dirname, filename);
  return fs.readFileSync(migrationPath, 'utf8');
}

/**
 * Execute a single migration
 */
async function executeMigration(filename) {
  console.log(`Executing migration: ${filename}`);
  
  try {
    const sql = readMigrationFile(filename);
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('COMMIT');
      console.log(`✓ Migration ${filename} completed successfully`);
      return { success: true, filename };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`✗ Migration ${filename} failed:`, error.message);
      return { success: false, filename, error: error.message };
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(`✗ Error reading migration file ${filename}:`, error.message);
    return { success: false, filename, error: error.message };
  }
}

/**
 * Run all migrations in order
 */
async function runAllMigrations() {
  console.log('Starting database migrations...');
  console.log('=====================================');
  
  const migrations = [
    '001_core_infrastructure.sql',
    '002_seed_esic_categories.sql',
    '003_purchase_module.sql',
    '016_align_procurement_schema.sql'
  ];
  
  const results = [];
  
  for (const migration of migrations) {
    const result = await executeMigration(migration);
    results.push(result);
    
    if (!result.success) {
      console.error(`\n❌ Migration failed at ${migration}. Stopping execution.`);
      console.log('\nMigration Results:');
      console.log('==================');
      results.forEach(r => {
        console.log(`${r.filename}: ${r.success ? '✓' : '✗'}`);
        if (!r.success) console.log(`  Error: ${r.error}`);
      });
      return { success: false, results };
    }
  }
  
  console.log('\n=====================================');
  console.log('✓ All migrations completed successfully');
  console.log('\nMigration Results:');
  console.log('==================');
  results.forEach(r => {
    console.log(`${r.filename}: ${r.success ? '✓' : '✗'}`);
  });
  
  return { success: true, results };
}

/**
 * Check if a table exists
 */
async function tableExists(tableName) {
  const query = `
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = $1
    );
  `;
  
  try {
    const result = await pool.query(query, [tableName]);
    return result.rows[0].exists;
  } catch (error) {
    console.error('Error checking table existence:', error);
    return false;
  }
}

/**
 * Get migration status
 */
async function getMigrationStatus() {
  const tables = [
    'esic_categories',
    'products',
    'suppliers',
    'customers',
    'budgets',
    'approval_workflow_configurations',
    'approval_workflow_stages',
    'approval_workflow_instances',
    'approval_workflow_actions',
    'transaction_log',
    'audit_trail',
    'system_configuration',
    'financial_periods'
  ];
  
  console.log('Checking migration status...');
  console.log('============================');
  
  const status = {};
  
  for (const table of tables) {
    const exists = await tableExists(table);
    status[table] = exists;
    console.log(`${table}: ${exists ? '✓' : '✗'}`);
  }
  
  return status;
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  try {
    switch (command) {
      case 'status':
        await getMigrationStatus();
        break;
      case 'run':
        await runAllMigrations();
        break;
      case 'single':
        const filename = args[1];
        if (!filename) {
          console.error('Please specify migration filename');
          process.exit(1);
        }
        await executeMigration(filename);
        break;
      default:
        console.log('Usage: node run-migrations.js [command]');
        console.log('Commands:');
        console.log('  status  - Check migration status');
        console.log('  run     - Run all pending migrations');
        console.log('  single  - Run a specific migration file');
        console.log('\nExample: node run-migrations.js run');
    }
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = {
  runAllMigrations,
  executeMigration,
  getMigrationStatus,
  tableExists
};
