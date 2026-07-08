import assert from 'node:assert/strict';
import { buildProcurementPosture } from '../src/lib/procurementDepth.js';
import { buildFinancePosture, buildFinanceLifecycle } from '../src/lib/financeDepth.js';

const procurement = buildProcurementPosture({
  state: 'to approve',
  amount_total: 1500,
  order_lines: [{ id: 1 }, { id: 2 }],
});
assert.equal(procurement.stage, 'approval');
assert.equal(procurement.approvalPending, true);
assert.equal(procurement.receiptPending, false);
assert.equal(procurement.status, 'approval_required');

const finance = buildFinancePosture({
  payments: [{ state: 'draft', amount: 100 }, { state: 'posted', amount: 200 }],
  salesOrders: [{ state: 'sale' }, { state: 'draft' }],
  purchaseOrders: [{ state: 'to approve' }, { state: 'done' }],
});
assert.equal(finance.pending, 1);
assert.equal(finance.receivablesPending, 1);
assert.equal(finance.payablesPending, 1);
assert.equal(finance.reportingReady, true);
assert.equal(finance.status, 'needs_follow_up');

const lifecycle = buildFinanceLifecycle([{ state: 'posted', amount: 50 }]);
assert.equal(lifecycle.reconciliationReady, true);

console.log('Wave 3 purchase/finance depth regression passed.');
