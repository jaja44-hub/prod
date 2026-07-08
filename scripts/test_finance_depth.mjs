import assert from 'node:assert/strict';
import { buildFinanceLifecycle } from '../src/lib/financeDepth.js';

const cases = [
  {
    name: 'returns reconciled-ready posture when posted items exist',
    input: [{ state: 'posted', amount: 1000 }, { state: 'posted', amount: 250 }],
    expected: {
      count: 2,
      total: 1250,
      posted: 2,
      draft: 0,
      pending: 0,
      reconciliationReady: true,
      status: 'reconciled_ready',
    },
  },
  {
    name: 'flags pending follow-up when draft items exist',
    input: [{ state: 'draft', amount: 100 }, { state: 'posted', amount: 200 }],
    expected: {
      count: 2,
      total: 300,
      posted: 1,
      draft: 1,
      pending: 1,
      reconciliationReady: true,
      status: 'needs_follow_up',
    },
  },
  {
    name: 'handles empty input',
    input: [],
    expected: {
      count: 0,
      total: 0,
      posted: 0,
      draft: 0,
      pending: 0,
      reconciliationReady: false,
      status: 'idle',
    },
  },
];

for (const testCase of cases) {
  const actual = buildFinanceLifecycle(testCase.input);
  assert.deepEqual(actual, testCase.expected, testCase.name);
}

console.log(`Finance depth regression passed (${cases.length} cases).`);
