import assert from 'node:assert/strict';
import { buildInventoryInsights, buildSalesLifecycle, buildPurchaseLifecycle } from '../src/lib/lifecycleDepth.js';

const inventory = buildInventoryInsights({ qty_available: 3, reorder_threshold: 5 }, { reserved_quantity: 2, quantity: 3 });
assert.equal(inventory.status, 'critical');
assert.equal(inventory.reorderRequired, true);
assert.equal(inventory.transferSuggested, true);

const sales = buildSalesLifecycle({ state: 'sale', amount_total: 1200, order_lines: [{ sku: 'A' }] });
assert.equal(sales.revenueReady, true);
assert.equal(sales.status, 'ready');

const purchase = buildPurchaseLifecycle({ state: 'to approve', amount_total: 3000, order_lines: [{ sku: 'B' }] });
assert.equal(purchase.approvalNeeded, true);
assert.equal(purchase.status, 'approval_required');

console.log('Ticket 042 lifecycle depth regression passed.');
