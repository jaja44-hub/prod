import assert from 'node:assert/strict';
import { buildCustomerPosture } from '../src/lib/crmDepth.js';
import { buildWarehousePosture } from '../src/lib/warehouseDepth.js';

const customer = buildCustomerPosture({ name: 'Acme', customer_rank: 1, supplier_rank: 0, email: '', phone: '' });
assert.equal(customer.followUpNeeded, true);
assert.equal(customer.status, 'follow_up_needed');

const warehouse = buildWarehousePosture({ state: 'confirmed', product_qty: 20 });
assert.equal(warehouse.needsAttention, true);
assert.equal(warehouse.dispatchReady, false);
assert.equal(warehouse.status, 'attention');

console.log('Wave 4 CRM and warehouse depth regression passed.');
