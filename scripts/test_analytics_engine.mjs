import assert from 'node:assert/strict';
import { buildTenantAnalyticsSnapshot } from '../server/api/analytics/engine.js';
import { createOrder } from '../server/api/sales/orders.js';

async function main() {
  // Integration test — requires the per-module Neon pool env vars.
  // Skip cleanly when not configured (CI/dev without secrets) so `npm test`
  // stays green; pool connectivity is exercised by the dedicated pool tests.
  const required = [
    'NEONACCOUNTINGDBURL', 'NEON_ACCOUNTING_DB_URL', 'neon_accounting_db_url',
    'NEONPROCUREMENTDBURL', 'NEON_PROCUREMENT_DB_URL', 'neon_procurement_db_url',
    'NEONANALYTICSDBURL', 'NEON_ANALYTICS_DB_URL', 'neon_analytics_db_url',
  ];
  const accountingConfigured = required.slice(0, 3).some((k) => process.env[k]);
  const procurementConfigured = required.slice(3, 6).some((k) => process.env[k]);
  const analyticsConfigured = required.slice(6, 9).some((k) => process.env[k]);
  if (!accountingConfigured || !procurementConfigured || !analyticsConfigured) {
    console.log('⏭ SKIP: Analytics engine integration test requires Neon module DB URLs (not configured).');
    return;
  }

  await createOrder('production', {
    partnerId: 'partner-001',
    name: 'Regression order',
    lines: [{ quantity: 2, unitPrice: 1250 }],
  });

  const snapshot = await buildTenantAnalyticsSnapshot({ tenantId: 'production' });

  assert.ok(snapshot && typeof snapshot === 'object');
  assert.equal(snapshot.tenantId, 'production');
  assert.ok(snapshot.summary && typeof snapshot.summary === 'object');
  assert.ok(snapshot.modules && typeof snapshot.modules === 'object');
  assert.ok(snapshot.modules.sales && snapshot.modules.crm && snapshot.modules.purchase && snapshot.modules.warehouse && snapshot.modules.finance);
  assert.ok(Array.isArray(snapshot.insights));
  assert.ok(snapshot.summary.totalRevenue >= 0);
  assert.ok(snapshot.summary.totalOrders >= 0);
  assert.ok(Array.isArray(snapshot.modules.warehouse.chartData) && snapshot.modules.warehouse.chartData.length > 0);
  assert.ok(Array.isArray(snapshot.modules.warehouse.breakdown) && snapshot.modules.warehouse.breakdown.length > 0);
  assert.ok(Array.isArray(snapshot.modules.finance.chartData) && snapshot.modules.finance.chartData.length > 0);
  assert.ok(Array.isArray(snapshot.modules.finance.breakdown) && snapshot.modules.finance.breakdown.length > 0);
  assert.ok(snapshot.modules.warehouse.metrics.readyToPick > 0, 'warehouse analytics should reflect seeded workflow activity');
  assert.ok(snapshot.modules.finance.metrics.totalReceivable > 0 && snapshot.modules.finance.metrics.totalPayable > 0, 'finance analytics should reflect seeded receivable and payable activity');
  assert.ok(snapshot.summary.totalOrders >= 6, 'analytics engine should observe seeded sales orders');
  assert.ok(snapshot.summary.totalRevenue >= 100000, 'analytics engine should observe meaningful revenue from seeded sales orders');
  assert.ok(snapshot.modules.purchase.metrics.vendors >= 3, 'purchase analytics should reflect multiple seeded vendors');
  console.log('✓ Analytics engine produces multi-module tenant snapshot');
}

main().catch((err) => {
  console.error('✗ Analytics engine test failed:', err.message);
  process.exit(1);
});
