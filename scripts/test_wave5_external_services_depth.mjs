import assert from 'node:assert/strict';
import { buildExternalServicePosture } from '../src/lib/externalServicesDepth.js';

const operational = buildExternalServicePosture({
  advisory: { available: true, confidence: 0.84, suggestions: [{ type: 'warning' }] },
  settlement: { grandTotal: 1150, rulesApplied: ['ET_VAT_15'] },
  auditEntries: [{ ts: '2026-07-08T00:00:00.000Z' }],
});
assert.equal(operational.status, 'operational');
assert.equal(operational.advisoryReady, true);
assert.equal(operational.settlementReady, true);
assert.equal(operational.governanceHealthy, true);
assert.equal(operational.auditCount, 1);

const degraded = buildExternalServicePosture({
  advisory: { available: false, confidence: 0.1, suggestions: [] },
  settlement: null,
  auditEntries: [],
});
assert.equal(degraded.status, 'degraded');
assert.equal(degraded.advisoryReady, false);
assert.equal(degraded.settlementReady, false);
assert.equal(degraded.governanceHealthy, false);

console.log('Wave 5 external services depth regression passed.');
