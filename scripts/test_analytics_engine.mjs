import assert from 'node:assert/strict';
import { buildTenantAnalyticsSnapshot } from '../server/api/analytics/engine.js';
import { createOrder } from '../server/api/sales/orders.js';

async function main() {
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
  assert.ok(snapshot.summary.totalOrders > 0, 'analytics engine should observe orders created through the sales module');
  assert.ok(snapshot.summary.totalRevenue > 0, 'analytics engine should observe revenue from the sales module');
  console.log('✓ Analytics engine produces multi-module tenant snapshot');
}

main().catch((err) => {
  console.error('✗ Analytics engine test failed:', err.message);
  process.exit(1);
});
