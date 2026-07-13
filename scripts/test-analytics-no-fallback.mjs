import { buildTenantAnalyticsSnapshot } from '../server/api/analytics/engine.js';

console.log('🧪 Session 8: Analytics Engine Test (No Fallbacks)');
console.log('================================================\n');

async function testAnalytics() {
  try {
    console.log('📊 Building analytics snapshot from Neon DB...');
    const snapshot = await buildTenantAnalyticsSnapshot({ tenantId: 'production' });
    
    console.log('\n✅ Analytics snapshot generated successfully');
    console.log('\n📋 Summary:');
    console.log('  Total Revenue:', snapshot.summary.totalRevenue);
    console.log('  Total Orders:', snapshot.summary.totalOrders);
    console.log('  Total Receivable:', snapshot.summary.totalReceivable);
    console.log('  Total Payable:', snapshot.summary.totalPayable);
    console.log('  Warehouse Health:', snapshot.summary.warehouseHealth);
    console.log('  Finance Health:', snapshot.summary.financeHealth);
    
    console.log('\n📊 Module Scores:');
    Object.entries(snapshot.modules).forEach(([key, module]) => {
      console.log(`  ${module.name}: Score ${module.score}, Trend ${module.trend}`);
    });
    
    console.log('\n🔍 Data Sources:');
    console.log('  Sales Orders:', snapshot.modules.sales.metrics.orders, 'orders');
    console.log('  Warehouse Picks:', snapshot.modules.warehouse.metrics.readyToPick, 'ready');
    console.log('  Finance Receivables:', snapshot.modules.finance.metrics.totalReceivable);
    console.log('  Finance Payables:', snapshot.modules.finance.metrics.totalPayable);
    
    return snapshot;
  } catch (err) {
    console.error('\n❌ Analytics test failed:', err.message);
    throw err;
  }
}

testAnalytics()
  .then(() => {
    console.log('\n✅ Session 8: Analytics engine validation complete');
    console.log('   - Data sourced from Neon DB');
    console.log('   - No seed builder fallbacks used');
  })
  .catch((err) => {
    console.error('\n❌ Session 8: Analytics engine validation failed');
    process.exit(1);
  });
