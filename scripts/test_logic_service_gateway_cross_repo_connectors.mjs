import assert from 'node:assert/strict';
import { getAdvisoryDecision, getSettlementDecision } from '../src/services/LogicServiceGateway.js';

const advisory = await getAdvisoryDecision({
  tenantId: 'tenant-a',
  module: 'legal_commerce_cost_estimator',
  entityId: 'service-001',
  contextType: 'service_cost_estimate',
  amount: 32000,
  serviceType: 'delivery',
  distanceKm: 45,
  requestedBy: 'ops@example.com',
});
assert.equal(advisory.ok, true);
assert.equal(advisory.source, 'cross-repo-connector');
assert.equal(advisory.connector, 'legal-commerce-cost-estimator');
assert.ok(advisory.metadata?.repo === 'legal-commerce');
assert.ok(advisory.suggestions.some((s) => s.message.includes('legal-commerce')));

const settlement = await getSettlementDecision({
  tenantId: 'tenant-a',
  module: 'gibi_sales_settlement',
  currency: 'ETB',
  subtotal: 15000,
  appliesWht: true,
  jurisdiction: 'ET',
  lineItems: [{ sku: 'A1', amount: 15000 }],
});
assert.equal(settlement.ok, true);
assert.equal(settlement.source, 'cross-repo-connector');
assert.equal(settlement.connector, 'gibi-sales-settlement');
assert.equal(settlement.commissionAmount, 150);
assert.equal(settlement.grandTotal, 16950);
assert.ok(settlement.rulesApplied.includes('ET_VAT_15'));
assert.ok(settlement.rulesApplied.includes('ET_WHT_2'));

console.log('Cross-repo connector contract regression passed.');
