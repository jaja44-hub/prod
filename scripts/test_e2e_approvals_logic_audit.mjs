import assert from 'node:assert/strict';

// Enable test capture mode so LogicServiceGateway captures audit events in-memory
process.env.TEST_CAPTURE_AUDIT = '1';

const { getAdvisoryDecision, getSettlementDecision, getTestAuditEntries } = await import('../src/services/LogicServiceGateway.js');

// Simulate the approval consult flow
const adv = await getAdvisoryDecision({ tenantId: 't1', module: 'Finance', entityId: 'inv-100', contextType: 'finance_invoice', amount: 60000, requestedBy: 'tester' });
assert.equal(adv.ok, true);

const sett = await getSettlementDecision({ tenantId: 't1', subtotal: 12000, appliesWht: true });
assert.equal(sett.ok, true);

// The adapter should have captured advisory_consulted and settlement_calculated events
const captured = getTestAuditEntries();
const actions = captured.map(a => a.action).filter(Boolean);
assert.ok(actions.includes('advisory_consulted'), `expected advisory_consulted in ${JSON.stringify(actions)}`);
assert.ok(actions.includes('settlement_calculated'), `expected settlement_calculated in ${JSON.stringify(actions)}`);

console.log('E2E approvals -> logic -> audit trail test passed.');
