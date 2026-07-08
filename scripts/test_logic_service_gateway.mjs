import assert from 'node:assert/strict';
import { getAdvisoryDecision, getSettlementDecision } from '../src/services/LogicServiceGateway.js';

const advisory = await getAdvisoryDecision({
  tenantId: 'tenant-a',
  module: 'Finance',
  entityId: 'invoice-001',
  contextType: 'finance_invoice',
  amount: 60000,
  complianceProfile: 'ethiopia_primary',
  tin: '',
  requestedBy: 'ops@example.com',
});
assert.equal(advisory.ok, true);
assert.ok(['local-stub', 'external-stub'].includes(advisory.source));
assert.equal(advisory.verdict, 'review');
assert.equal(advisory.suggestions.length > 0, true);

const settlement = await getSettlementDecision({
  tenantId: 'tenant-a',
  currency: 'ETB',
  subtotal: 10000,
  appliesWht: true,
  jurisdiction: 'ET',
  lineItems: [{ sku: 'A1', amount: 10000 }],
});
assert.equal(settlement.ok, true);
assert.ok(['local-stub', 'external-stub'].includes(settlement.source));
assert.equal(settlement.grandTotal, 11300);
assert.equal(settlement.rulesApplied.includes('ET_VAT_15'), true);
assert.equal(settlement.rulesApplied.includes('ET_WHT_2'), true);

console.log('Logic service gateway starter contract regression passed.');
