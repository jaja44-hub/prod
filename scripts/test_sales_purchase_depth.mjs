import assert from 'node:assert/strict';
import { buildSalesLifecycle, buildPurchaseLifecycle } from '../src/lib/salesPurchaseDepth.js';

const sales = buildSalesLifecycle({ state: 'draft', amount_total: 1200, order_lines: [{ id: 1 }] });
assert.equal(sales.followUpNeeded, true, 'draft sales should require follow-up');
assert.equal(sales.revenueReady, false, 'draft sales should not be marked revenue ready');
assert.equal(sales.status, 'attention', 'draft sales should be flagged for attention');

const purchase = buildPurchaseLifecycle({ state: 'to approve', amount_total: 500, order_lines: [{ id: 1 }] });
assert.equal(purchase.approvalNeeded, true, 'to-approve purchases should need approval');
assert.equal(purchase.receiptPending, true, 'to-approve purchases should be marked receipt pending');
assert.equal(purchase.status, 'approval_required', 'to-approve purchases should show approval-required status');

console.log('sales-purchase-depth tests passed');
