import { computeAgingBuckets, getWarehouseMetrics, getSalesAnalytics } from '../server/api/lib/neonAgingQueries.js';

console.log('🧪 Testing Neon DB Queries');
console.log('=========================\n');

async function testAgingBuckets() {
  console.log('📦 Testing computeAgingBuckets...');
  try {
    const result = await computeAgingBuckets('production');
    console.log('  ✅ Aging buckets computed');
    console.log(`     Total Payable: ${result.summary.totalPayable}`);
    console.log(`     Total Receivable: ${result.summary.totalReceivable}`);
    console.log(`     Vendor Count: ${result.summary.vendorCount}`);
    console.log(`     Customer Count: ${result.summary.customerCount}`);
    return true;
  } catch (err) {
    console.error('  ❌ Failed:', err.message);
    return false;
  }
}

async function testWarehouseMetrics() {
  console.log('📦 Testing getWarehouseMetrics...');
  try {
    const result = await getWarehouseMetrics('production');
    console.log(`  ✅ Retrieved ${result.length} warehouse metrics`);
    if (result.length > 0) {
      console.log(`     First picking: ${result[0].picking_id}, state: ${result[0].state}`);
    }
    return true;
  } catch (err) {
    console.error('  ❌ Failed:', err.message);
    return false;
  }
}

async function testSalesAnalytics() {
  console.log('📦 Testing getSalesAnalytics...');
  try {
    const result = await getSalesAnalytics('production');
    console.log(`  ✅ Retrieved ${result.length} sales analytics`);
    if (result.length > 0) {
      console.log(`     First order: ${result[0].order_name}, amount: ${result[0].amount_total}`);
    }
    return true;
  } catch (err) {
    console.error('  ❌ Failed:', err.message);
    return false;
  }
}

async function main() {
  const results = await Promise.all([
    testAgingBuckets(),
    testWarehouseMetrics(),
    testSalesAnalytics(),
  ]);

  const passed = results.filter(r => r).length;
  const total = results.length;

  console.log('\n' + '='.repeat(60));
  console.log('📋 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Passed: ${passed}/${total}`);
  console.log('='.repeat(60) + '\n');

  if (passed === total) {
    console.log('✅ All Neon DB queries working correctly\n');
  } else {
    console.log('⚠️  Some queries failed\n');
  }
}

main();
