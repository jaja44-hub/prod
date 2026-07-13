import { queryNeon } from '../server/api/lib/neonClient.js';

console.log('🔍 Session 8: Neon DB Data Quality Check');
console.log('========================================\n');

async function checkDataQuality() {
  try {
    console.log('📊 Checking vendor bills data...');
    const vendorBills = await queryNeon('SELECT * FROM vendor_bills LIMIT 5');
    console.log('  Sample vendor bills:', vendorBills.rows);
    
    console.log('\n📊 Checking warehouse metrics data...');
    const warehouse = await queryNeon('SELECT * FROM warehouse_metrics LIMIT 5');
    console.log('  Sample warehouse metrics:', warehouse.rows);
    
    console.log('\n📊 Checking sales analytics data...');
    const sales = await queryNeon('SELECT * FROM sales_analytics LIMIT 5');
    console.log('  Sample sales analytics:', sales.rows);
    
    console.log('\n📊 Checking customer invoices data...');
    const customerInvoices = await queryNeon('SELECT * FROM customer_invoices LIMIT 5');
    console.log('  Sample customer invoices:', customerInvoices.rows);
    
    console.log('\n📊 Checking aggregate totals...');
    const totals = await queryNeon(`
      SELECT 
        (SELECT COUNT(*) FROM vendor_bills) as vendor_count,
        (SELECT COUNT(*) FROM warehouse_metrics) as warehouse_count,
        (SELECT COUNT(*) FROM sales_analytics) as sales_count,
        (SELECT COUNT(*) FROM customer_invoices) as customer_count,
        (SELECT COALESCE(SUM(amount), 0) FROM vendor_bills) as total_vendor_amount,
        (SELECT COALESCE(SUM(amount), 0) FROM customer_invoices) as total_customer_amount
    `);
    console.log('  Totals:', totals.rows[0]);
    
  } catch (err) {
    console.error('❌ Data quality check failed:', err.message);
    throw err;
  }
}

checkDataQuality()
  .then(() => console.log('\n✅ Data quality check complete'))
  .catch(() => process.exit(1));
