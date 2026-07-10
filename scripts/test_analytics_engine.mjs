import assert from 'node:assert/strict';
import { buildTenantAnalyticsSnapshot } from '../server/api/analytics/engine.js';

async function main() {
  const snapshot = await buildTenantAnalyticsSnapshot({ tenantId: 'production' });

  assert.ok(snapshot && typeof snapshot === 'object');
  assert.equal(snapshot.tenantId, 'production');
  assert.ok(snapshot.summary && typeof snapshot.summary === 'object');
  assert.ok(snapshot.modules && typeof snapshot.modules === 'object');
  assert.ok(snapshot.modules.sales && snapshot.modules.crm && snapshot.modules.purchase && snapshot.modules.warehouse && snapshot.modules.finance);
  assert.ok(Array.isArray(snapshot.insights));
  assert.ok(snapshot.summary.totalRevenue >= 0);
  assert.ok(snapshot.summary.totalOrders >= 0);
  console.log('✓ Analytics engine produces multi-module tenant snapshot');
}

main().catch((err) => {
  console.error('✗ Analytics engine test failed:', err.message);
  process.exit(1);
});
