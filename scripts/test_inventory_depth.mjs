import assert from 'node:assert/strict';
import { buildInventoryInsights } from '../src/lib/inventoryDepth.js';

const insights = buildInventoryInsights({
  qty_available: 3,
  reserved_quantity: 2,
  reorder_threshold: 5,
  quantity: 5,
});

assert.equal(insights.status, 'critical', 'low stock should resolve to critical state');
assert.equal(insights.reorderRequired, true, 'critical stock should require reorder');
assert.equal(insights.transferSuggested, true, 'stock with reserved quantity should suggest transfer review');
console.log('inventory-depth tests passed');
