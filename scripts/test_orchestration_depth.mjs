import assert from 'node:assert/strict';
import { buildCrossModulePosture } from '../src/lib/orchestrationDepth.js';

const cases = [
  {
    name: 'flags a mixed posture with the right focus areas',
    input: {
      inventorySummary: { status: 'critical', reorderRequired: true },
      salesLifecycle: { followUpNeeded: true, revenueReady: false },
      purchaseLifecycle: { approvalNeeded: true, receiptPending: false },
      financeLifecycle: { pending: 2, reconciliationReady: true },
    },
    expected: {
      severity: 'critical',
      focusAreas: ['inventory', 'sales', 'purchase', 'finance'],
      issueCount: 4,
      headline: 'Cross-module posture requires immediate attention',
    },
  },
  {
    name: 'returns a healthy posture when nothing is urgent',
    input: {
      inventorySummary: { status: 'healthy', reorderRequired: false },
      salesLifecycle: { followUpNeeded: false, revenueReady: true },
      purchaseLifecycle: { approvalNeeded: false, receiptPending: false },
      financeLifecycle: { pending: 0, reconciliationReady: true },
    },
    expected: {
      severity: 'healthy',
      focusAreas: [],
      issueCount: 0,
      headline: 'Cross-module posture is stable',
    },
  },
];

for (const testCase of cases) {
  const actual = buildCrossModulePosture(testCase.input);
  assert.deepEqual(actual, testCase.expected, testCase.name);
}

console.log(`Cross-module orchestration regression passed (${cases.length} cases).`);
