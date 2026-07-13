import { createAgingTables } from '../server/api/lib/neonAgingQueries.js';
import { queryNeon } from '../server/api/lib/neonClient.js';

console.log('🔧 Session 5: Neon DB Table Setup');
console.log('================================\n');

async function createWarehouseMetricsTable() {
  const createTable = `
    CREATE TABLE IF NOT EXISTS warehouse_metrics (
      id SERIAL PRIMARY KEY,
      picking_id VARCHAR(50) UNIQUE NOT NULL,
      picking_type VARCHAR(50) NOT NULL,
      state VARCHAR(50) NOT NULL,
      scheduled_date DATE NOT NULL,
      location_src VARCHAR(100),
      location_dest VARCHAR(100),
      tenant_id VARCHAR(50) DEFAULT 'production',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const createIndexes = `
    CREATE INDEX IF NOT EXISTS idx_warehouse_metrics_tenant ON warehouse_metrics(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_warehouse_metrics_state ON warehouse_metrics(state);
    CREATE INDEX IF NOT EXISTS idx_warehouse_metrics_scheduled_date ON warehouse_metrics(scheduled_date);
  `;

  await queryNeon(createTable);
  await queryNeon(createIndexes);
  console.log('  ✅ warehouse_metrics table created');
}

async function createSalesAnalyticsTable() {
  const createTable = `
    CREATE TABLE IF NOT EXISTS sales_analytics (
      id SERIAL PRIMARY KEY,
      order_id VARCHAR(50) UNIQUE NOT NULL,
      order_name VARCHAR(100) NOT NULL,
      state VARCHAR(50) NOT NULL,
      date_order DATE NOT NULL,
      amount_total DECIMAL(15, 2) NOT NULL,
      currency VARCHAR(10) DEFAULT 'ETB',
      partner_id INTEGER,
      partner_name VARCHAR(255),
      tenant_id VARCHAR(50) DEFAULT 'production',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const createIndexes = `
    CREATE INDEX IF NOT EXISTS idx_sales_analytics_tenant ON sales_analytics(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_sales_analytics_state ON sales_analytics(state);
    CREATE INDEX IF NOT EXISTS idx_sales_analytics_date_order ON sales_analytics(date_order);
  `;

  await queryNeon(createTable);
  await queryNeon(createIndexes);
  console.log('  ✅ sales_analytics table created');
}

async function main() {
  try {
    console.log('📦 Creating Neon DB tables...\n');

    // Create finance tables (vendor_bills, customer_invoices)
    await createAgingTables();

    // Create warehouse metrics table
    await createWarehouseMetricsTable();

    // Create sales analytics table
    await createSalesAnalyticsTable();

    console.log('\n' + '='.repeat(60));
    console.log('✅ All Neon DB tables created successfully');
    console.log('='.repeat(60) + '\n');
  } catch (error) {
    console.error('\n❌ Failed to create Neon DB tables:', error);
    process.exit(1);
  }
}

main();
