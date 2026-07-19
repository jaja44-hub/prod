/**
 * Phase 2: Purchase Module Test Suite
 * Tests all Phase 2 deliverables to ensure functionality
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
 * Test 1: Purchase Requisitions Table Exists
 */
async function testPurchaseRequisitionsTable() {
  try {
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'purchase_requisitions'
      );
    `);
    const exists = result.rows[0].exists;
    logTest('Purchase Requisitions Table Exists', exists);
  } catch (error) {
    logTest('Purchase Requisitions Table Exists', false, error);
  }
}

/**
 * Test 2: Purchase Requisition Items Table Exists
 */
async function testPurchaseRequisitionItemsTable() {
  try {
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'purchase_requisition_items'
      );
    `);
    const exists = result.rows[0].exists;
    logTest('Purchase Requisition Items Table Exists', exists);
  } catch (error) {
    logTest('Purchase Requisition Items Table Exists', false, error);
  }
}

/**
 * Test 3: Purchase Orders Table Exists
 */
async function testPurchaseOrdersTable() {
  try {
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'purchase_orders'
      );
    `);
    const exists = result.rows[0].exists;
    logTest('Purchase Orders Table Exists', exists);
  } catch (error) {
    logTest('Purchase Orders Table Exists', false, error);
  }
}

/**
 * Test 4: Purchase Order Items Table Exists
 */
async function testPurchaseOrderItemsTable() {
  try {
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'purchase_order_items'
      );
    `);
    const exists = result.rows[0].exists;
    logTest('Purchase Order Items Table Exists', exists);
  } catch (error) {
    logTest('Purchase Order Items Table Exists', false, error);
  }
}

/**
 * Test 5: Supplier Quotations Table Exists
 */
async function testSupplierQuotationsTable() {
  try {
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'supplier_quotations'
      );
    `);
    const exists = result.rows[0].exists;
    logTest('Supplier Quotations Table Exists', exists);
  } catch (error) {
    logTest('Supplier Quotations Table Exists', false, error);
  }
}

/**
 * Test 6: Budget Commitments Table Exists
 */
async function testBudgetCommitmentsTable() {
  try {
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'budget_commitments'
      );
    `);
    const exists = result.rows[0].exists;
    logTest('Budget Commitments Table Exists', exists);
  } catch (error) {
    logTest('Budget Commitments Table Exists', false, error);
  }
}

/**
 * Test 7: Warehouse Receipts Table Exists
 */
async function testWarehouseReceiptsTable() {
  try {
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'warehouse_receipts'
      );
    `);
    const exists = result.rows[0].exists;
    logTest('Warehouse Receipts Table Exists', exists);
  } catch (error) {
    logTest('Warehouse Receipts Table Exists', false, error);
  }
}

/**
 * Test 8: Warehouse Receipt Items Table Exists
 */
async function testWarehouseReceiptItemsTable() {
  try {
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'warehouse_receipt_items'
      );
    `);
    const exists = result.rows[0].exists;
    logTest('Warehouse Receipt Items Table Exists', exists);
  } catch (error) {
    logTest('Warehouse Receipt Items Table Exists', false, error);
  }
}

/**
 * Test 9: Purchase Documents Table Exists
 */
async function testPurchaseDocumentsTable() {
  try {
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'purchase_documents'
      );
    `);
    const exists = result.rows[0].exists;
    logTest('Purchase Documents Table Exists', exists);
  } catch (error) {
    logTest('Purchase Documents Table Exists', false, error);
  }
}

/**
 * Test 10: Purchase Comments Table Exists
 */
async function testPurchaseCommentsTable() {
  try {
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'purchase_comments'
      );
    `);
    const exists = result.rows[0].exists;
    logTest('Purchase Comments Table Exists', exists);
  } catch (error) {
    logTest('Purchase Comments Table Exists', false, error);
  }
}

/**
 * Test 11: Foreign Key Relationships
 */
async function testForeignKeys() {
  try {
    const tables = [
      'purchase_requisitions',
      'purchase_orders',
      'warehouse_receipts'
    ];
    
    let allForeignKeysValid = true;
    
    for (const table of tables) {
      const result = await pool.query(`
        SELECT COUNT(*) as count
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_schema = 'public'
          AND tc.table_name = $1
          AND tc.constraint_type = 'FOREIGN KEY'
      `, [table]);
      
      const fkCount = parseInt(result.rows[0].count);
      if (fkCount === 0) {
        allForeignKeysValid = false;
        console.log(`  ${table} has no foreign keys`);
      }
    }
    
    logTest('Foreign Key Relationships Valid', allForeignKeysValid);
  } catch (error) {
    logTest('Foreign Key Relationships Valid', false, error);
  }
}

/**
 * Test 12: Generated Columns
 */
async function testGeneratedColumns() {
  try {
    const tablesWithGeneratedColumns = [
      { table: 'purchase_order_items', columns: ['quantity_pending', 'total_price', 'vat_amount', 'withholding_tax_amount', 'line_total'] },
      { table: 'purchase_requisition_items', columns: ['total_price'] },
      { table: 'warehouse_receipt_items', columns: ['total_cost'] }
    ];
    
    let allGeneratedColumnsValid = true;
    
    for (const { table, columns } of tablesWithGeneratedColumns) {
      for (const column of columns) {
        const result = await pool.query(`
          SELECT column_default
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = $1
            AND column_name = $2
        `, [table, column]);
        
        if (result.rows.length === 0 || !result.rows[0].column_default) {
          allGeneratedColumnsValid = false;
          console.log(`  ${table}.${column} is not a generated column`);
        }
      }
    }
    
    logTest('Generated Columns Valid', allGeneratedColumnsValid);
  } catch (error) {
    logTest('Generated Columns Valid', false, error);
  }
}

/**
 * Test 13: Indexes Created
 */
async function testIndexesCreated() {
  try {
    const result = await pool.query(`
      SELECT COUNT(*) as count 
      FROM pg_indexes 
      WHERE schemaname = 'public'
        AND tablename LIKE 'purchase_%' OR tablename LIKE 'warehouse_%' OR tablename = 'budget_commitments'
    `);
    const count = parseInt(result.rows[0].count);
    const passed = count >= 15; // Should have at least 15 indexes for purchase module
    logTest('Purchase Module Indexes Created', passed);
    console.log(`  Indexes count: ${count}`);
  } catch (error) {
    logTest('Purchase Module Indexes Created', false, error);
  }
}

/**
 * Test 14: Purchase Module API Files Exist
 */
async function testAPIFilesExist() {
  try {
    const fs = require('fs');
    const path = require('path');
    
    const apiFiles = [
      'server/api/purchase/requisitions.js',
      'server/api/purchase/orders.js',
      'server/api/purchase/suppliers.js',
      'server/api/purchase/budget.js',
      'server/api/purchase/receipts.js',
      'server/api/purchase/router.js'
    ];
    
    let allFilesExist = true;
    
    for (const file of apiFiles) {
      const filePath = path.join(process.cwd(), '..', file);
      if (!fs.existsSync(filePath)) {
        allFilesExist = false;
        console.log(`  Missing: ${file}`);
      }
    }
    
    logTest('Purchase Module API Files Exist', allFilesExist);
  } catch (error) {
    logTest('Purchase Module API Files Exist', false, error);
  }
}

/**
 * Test 15: Budget Available Amount Calculation
 */
async function testBudgetAvailableAmount() {
  try {
    const result = await pool.query(`
      SELECT COUNT(*) as count
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'budgets'
        AND column_name = 'available_amount'
        AND column_default LIKE '%STORED%'
    `);
    const count = parseInt(result.rows[0].count);
    const passed = count > 0;
    logTest('Budget Available Amount Generated Column', passed);
  } catch (error) {
    logTest('Budget Available Amount Generated Column', false, error);
  }
}

/**
 * Test 16: Purchase Requisition Status Enum
 */
async function testRequisitionStatusValues() {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'purchase_requisitions'
        AND column_name = 'status'
    `);
    const passed = result.rows.length > 0;
    logTest('Purchase Requisition Status Column', passed);
  } catch (error) {
    logTest('Purchase Requisition Status Column', false, error);
  }
}

/**
 * Test 17: Purchase Order Status Enum
 */
async function testPOStatusValues() {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'purchase_orders'
        AND column_name = 'status'
    `);
    const passed = result.rows.length > 0;
    logTest('Purchase Order Status Column', passed);
  } catch (error) {
    logTest('Purchase Order Status Column', false, error);
  }
}

/**
 * Test 18: Warehouse Receipt Status Enum
 */
async function testReceiptStatusValues() {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'warehouse_receipts'
        AND column_name = 'status'
    `);
    const passed = result.rows.length > 0;
    logTest('Warehouse Receipt Status Column', passed);
  } catch (error) {
    logTest('Warehouse Receipt Status Column', false, error);
  }
}

/**
 * Test 19: Updated At Triggers
 */
async function testUpdatedAtTriggers() {
  try {
    const tables = [
      'purchase_requisitions',
      'purchase_requisition_items',
      'purchase_orders',
      'purchase_order_items',
      'warehouse_receipts',
      'warehouse_receipt_items'
    ];
    
    let allTriggersValid = true;
    
    for (const table of tables) {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM pg_trigger
          WHERE tgname = $1
        )
      `, [`update_${table}_updated_at`]);
      
      if (!result.rows[0].exists) {
        allTriggersValid = false;
        console.log(`  Missing trigger: update_${table}_updated_at`);
      }
    }
    
    logTest('Updated At Triggers Created', allTriggersValid);
  } catch (error) {
    logTest('Updated At Triggers Created', false, error);
  }
}

/**
 * Test 20: Migration Script Updated
 */
async function testMigrationScriptUpdated() {
  try {
    const fs = require('fs');
    const path = require('path');
    
    const migrationPath = path.join(process.cwd(), '..', 'server/migrations/run-migrations.js');
    const migrationContent = fs.readFileSync(migrationPath, 'utf8');
    
    const passed = migrationContent.includes('003_purchase_module.sql');
    logTest('Migration Script Updated', passed);
  } catch (error) {
    logTest('Migration Script Updated', false, error);
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('========================================');
  console.log('Phase 2: Purchase Module Test Suite');
  console.log('========================================\n');
  
  await testPurchaseRequisitionsTable();
  await testPurchaseRequisitionItemsTable();
  await testPurchaseOrdersTable();
  await testPurchaseOrderItemsTable();
  await testSupplierQuotationsTable();
  await testBudgetCommitmentsTable();
  await testWarehouseReceiptsTable();
  await testWarehouseReceiptItemsTable();
  await testPurchaseDocumentsTable();
  await testPurchaseCommentsTable();
  await testForeignKeys();
  await testGeneratedColumns();
  await testIndexesCreated();
  await testAPIFilesExist();
  await testBudgetAvailableAmount();
  await testRequisitionStatusValues();
  await testPOStatusValues();
  await testReceiptStatusValues();
  await testUpdatedAtTriggers();
  await testMigrationScriptUpdated();
  
  console.log('\n========================================');
  console.log('Test Results Summary');
  console.log('========================================');
  console.log(`Total Tests: ${testResults.tests.length}`);
  console.log(`Passed: ${testResults.passed}`);
  console.log(`Failed: ${testResults.failed}`);
  console.log(`Success Rate: ${((testResults.passed / testResults.tests.length) * 100).toFixed(2)}%`);
  
  if (testResults.failed === 0) {
    console.log('\n✓ All tests passed! Phase 2 is ready.');
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
