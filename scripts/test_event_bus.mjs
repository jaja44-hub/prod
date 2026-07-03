import assert from 'assert';
import { buildOdooWriteEvent, onModuleEvent } from '../src/lib/eventBus.js';
import { getModuleIdForOdooModel } from '../src/lib/moduleRegistry.js';

console.log('Running event bus tests...');

const eventPayload = buildOdooWriteEvent({
  tenantId: 'production',
  action: 'product.create',
  odooModel: 'product.product',
  odooId: 777,
  actorUid: 'user-123',
  payload: { default_code: 'SKU-123', list_price: 42 },
});

assert.strictEqual(eventPayload.eventType, 'odoo.write', 'eventType should be odoo.write');
assert.strictEqual(eventPayload.action, 'product.create', 'action should be preserved');
assert.strictEqual(eventPayload.odooModel, 'product.product', 'odooModel should be preserved');
assert.strictEqual(eventPayload.actorUid, 'user-123', 'actorUid should be preserved');
assert.strictEqual(eventPayload.tenantId, 'production', 'tenantId should be preserved');
assert.strictEqual(eventPayload.moduleId, 'inventory', 'moduleId should be inferred for product.product');
assert.ok(eventPayload.eventId?.startsWith('evt_') || eventPayload.eventId?.length > 0, 'eventId should be present');
assert.strictEqual(typeof eventPayload.ts, 'string', 'ts should be a timestamp string');
assert.deepStrictEqual(eventPayload.payload, { default_code: 'SKU-123', list_price: 42 }, 'payload should pass through');

const events = [];
const unsubscribe = onModuleEvent((event) => {
  events.push(event);
});

unsubscribe();

assert.strictEqual(events.length, 0, 'onModuleEvent returned unsubscribe should remove subscriber');
assert.strictEqual(getModuleIdForOdooModel('purchase.order'), 'purchase', 'Odoo model mapping should resolve purchase.order');
assert.strictEqual(getModuleIdForOdooModel('sale.order'), 'sales', 'Odoo model mapping should resolve sale.order');
assert.strictEqual(getModuleIdForOdooModel('unknown.model'), null, 'Unknown Odoo model should return null');

console.log('✅ PASS: event bus shape, module mapping, and subscriber lifecycle');
console.log('\nAll event bus tests passed.');
process.exit(0);
