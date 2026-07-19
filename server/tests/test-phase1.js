/**
 * Phase 1 Core Infrastructure Test Suite
 * Tests all Phase 1 deliverables to ensure functionality
 */

const { Pool } = require('pg');
require('dotenv').config();

// Database connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

/**
 * Log test result
 */
function logTest(testName, passed, error = null) {
  const result = {
    test: testName,
    passed,
    error: error ? error.message : null,
    timestamp: new Date().toISOString()
  };
  
  testResults.tests.push(result);
  
  if (passed) {
    testResults.passed++;
    console.log(`✓ ${testName}`);
  } else {
    testResults.failed++;
    console.log(`✗ ${testName}`);
    if (error) console.log(`  Error: ${error.message}`);
  }
}

/**
 * Test 1: Database Connection
 */
async function testDatabaseConnection() {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    logTest('Database Connection', true);
  } catch (error) {
    logTest('Database Connection', false, error);
  }
}

/**
 * Test 2: ESIC Categories Table Exists
 */
async function testEsicCategoriesTable() {
  try {
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'esic_categories'
      );
    `);
    const exists = result.rows[0].exists;
    logTest('ESIC Categories Table Exists', exists);
  } catch (error) {
    logTest('ESIC Categories Table Exists', false, error);
  }
}

/**
 * Test 3: ESIC Categories Data Seeded
 */
async function testEsicCategoriesData() {
  try {
    const result = await pool.query('SELECT COUNT(*) as count FROM esic_categories');
    const count = parseInt(result.rows[0].count);
    const passed = count > 100; // Should have at least 100 categories
    logTest('ESIC Categories Data Seeded', passed, null);
    console.log(`  Categories count: ${count}`);
  } catch (error) {
    logTest('ESIC Categories Data Seeded', false, error);
  }
}

/**
 * Test 4: Products Table Exists
 */
async function testProductsTable() {
  try {
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'products'
      );
    `);
    const exists = result.rows[0].exists;
    logTest('Products Table Exists', exists);
  } catch (error) {
    logTest('Products Table Exists', false, error);
  }
}

/**
 * Test 5: Suppliers Table Exists
 */
async function testSuppliersTable() {
  try {
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'suppliers'
      );
    `);
    const exists = result.rows[0].exists;
    logTest('Suppliers Table Exists', exists);
  } catch (error) {
    logTest('Suppliers Table Exists', false, error);
  }
}

/**
 * Test 6: Budgets Table Exists
 */
async function testBudgetsTable() {
  try {
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'budgets'
      );
    `);
    const exists = result.rows[0].exists;
    logTest('Budgets Table Exists', exists);
  } catch (error) {
    logTest('Budgets Table Exists', false, error);
  }
}

/**
 * Test 7: Approval Workflow Tables Exist
 */
async function testApprovalWorkflowTables() {
  try {
    const tables = [
      'approval_workflow_configurations',
      'approval_workflow_stages',
      'approval_workflow_instances',
      'approval_workflow_actions'
    ];
    
    let allExist = true;
    for (const table of tables) {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        );
      `, [table]);
      
      if (!result.rows[0].exists) {
        allExist = false;
        break;
      }
    }
    
    logTest('Approval Workflow Tables Exist', allExist);
  } catch (error) {
    logTest('Approval Workflow Tables Exist', false, error);
  }
}

/**
 * Test 8: Transaction Logging Tables Exist
 */
async function testTransactionLoggingTables() {
  try {
    const tables = [
      'transaction_log',
      'audit_trail'
    ];
    
    let allExist = true;
    for (const table of tables) {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        );
      `, [table]);
      
      if (!result.rows[0].exists) {
        allExist = false;
        break;
      }
    }
    
    logTest('Transaction Logging Tables Exist', allExist);
  } catch (error) {
    logTest('Transaction Logging Tables Exist', false, error);
  }
}

/**
 * Test 9: Category Hierarchy Query
 */
async function testCategoryHierarchy() {
  try {
    const result = await pool.query(`
      WITH RECURSIVE category_tree AS (
        SELECT id, code, name, parent_id, level
        FROM esic_categories
        WHERE parent_id IS NULL
        UNION ALL
        SELECT c.id, c.code, c.name, c.parent_id, c.level
        FROM esic_categories c
        INNER JOIN category_tree ct ON c.parent_id = ct.id
      )
      SELECT COUNT(*) as count FROM category_tree
    `);
    const count = parseInt(result.rows[0].count);
    const passed = count > 0;
    logTest('Category Hierarchy Query', passed);
    console.log(`  Hierarchy nodes: ${count}`);
  } catch (error) {
    logTest('Category Hierarchy Query', false, error);
  }
}

/**
 * Test 10: Tax-Applicable Categories
 */
async function testTaxApplicableCategories() {
  try {
    const result = await pool.query(`
      SELECT COUNT(*) as count 
      FROM esic_categories 
      WHERE tax_applicable = true AND active = true
    `);
    const count = parseInt(result.rows[0].count);
    const passed = count > 0;
    logTest('Tax-Applicable Categories', passed);
    console.log(`  Tax-applicable categories: ${count}`);
  } catch (error) {
    logTest('Tax-Applicable Categories', false, error);
  }
}

/**
 * Test 11: System Configuration Table Exists
 */
async function testSystemConfigurationTable() {
  try {
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'system_configuration'
      );
    `);
    const exists = result.rows[0].exists;
    logTest('System Configuration Table Exists', exists);
  } catch (error) {
    logTest('System Configuration Table Exists', false, error);
  }
}

/**
 * Test 12: Financial Periods Table Exists
 */
async function testFinancialPeriodsTable() {
  try {
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'financial_periods'
      );
    `);
    const exists = result.rows[0].exists;
    logTest('Financial Periods Table Exists', exists);
  } catch (error) {
    logTest('Financial Periods Table Exists', false, error);
  }
}

/**
 * Test 13: Updated At Trigger Function
 */
async function testUpdatedAtTrigger() {
  try {
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM pg_proc 
        WHERE proname = 'update_updated_at_column'
      );
    `);
    const exists = result.rows[0].exists;
    logTest('Updated At Trigger Function', exists);
  } catch (error) {
    logTest('Updated At Trigger Function', false, error);
  }
}

/**
 * Test 14: Indexes Created
 */
async function testIndexesCreated() {
  try {
    const result = await pool.query(`
      SELECT COUNT(*) as count 
      FROM pg_indexes 
      WHERE schemaname = 'public'
    `);
    const count = parseInt(result.rows[0].count);
    const passed = count >= 10; // Should have at least 10 indexes
    logTest('Indexes Created', passed);
    console.log(`  Indexes count: ${count}`);
  } catch (error) {
    logTest('Indexes Created', false, error);
  }
}

/**
 * Test 15: Category Level Distribution
 */
async function testCategoryLevelDistribution() {
  try {
    const result = await pool.query(`
      SELECT level, COUNT(*) as count 
      FROM esic_categories 
      WHERE active = true 
      GROUP BY level 
      ORDER BY level
    `);
    const passed = result.rows.length > 0;
    logTest('Category Level Distribution', passed);
    console.log(`  Levels found: ${result.rows.length}`);
    result.rows.forEach(row => {
      console.log(`    Level ${row.level}: ${row.count} categories`);
    });
  } catch (error) {
    logTest('Category Level Distribution', false, error);
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('========================================');
  console.log('Phase 1 Core Infrastructure Test Suite');
  console.log('========================================\n');
  
  await testDatabaseConnection();
  await testEsicCategoriesTable();
  await testEsicCategoriesData();
  await testProductsTable();
  await testSuppliersTable();
  await testBudgetsTable();
  await testApprovalWorkflowTables();
  await testTransactionLoggingTables();
  await testCategoryHierarchy();
  await testTaxApplicableCategories();
  await testSystemConfigurationTable();
  await testFinancialPeriodsTable();
  await testUpdatedAtTrigger();
  await testIndexesCreated();
  await testCategoryLevelDistribution();
  
  console.log('\n========================================');
  console.log('Test Results Summary');
  console.log('========================================');
  console.log(`Total Tests: ${testResults.tests.length}`);
  console.log(`Passed: ${testResults.passed}`);
  console.log(`Failed: ${testResults.failed}`);
  console.log(`Success Rate: ${((testResults.passed / testResults.tests.length) * 100).toFixed(2)}%`);
  
  if (testResults.failed === 0) {
    console.log('\n✓ All tests passed! Phase 1 is ready.');
  } else {
    console.log('\n✗ Some tests failed. Please review the errors above.');
  }
  
  console.log('\nDetailed Results:');
  console.log('==================');
  testResults.tests.forEach(test => {
    console.log(`${test.passed ? '✓' : '✗'} ${test.test}`);
    if (test.error) console.log(`  ${test.error}`);
  });
  
  await pool.end();
  
  return testResults.failed === 0;
}

// Run tests if executed directly
if (require.main === module) {
  runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test suite error:', error);
      process.exit(1);
    });
}

module.exports = { runAllTests };
