import { getMovements } from '../server/api/inventory/movements.js';
import { computeReorderSuggestion } from '../server/api/inventory/reorder-suggestion.js';
import { buildTransferRecord, buildWarehouseSummary, buildPickPackShipWorkflow } from '../server/api/inventory/warehouse.js';
import { createCycleCount, getCycleCounts, applyCycleCountAdjustment } from '../server/api/inventory/cycle-counts.js';

(async () => {
  try {
    const mov = await getMovements('test-tenant');
    if (!Array.isArray(mov) || mov.length === 0) throw new Error('Expected movements array');
    if (!mov.every((item) => item.tenantId === 'test-tenant')) throw new Error('Tenant ID missing in movements');

    const r1 = computeReorderSuggestion({ currentStock: 5, reorderPoint: 20, moq: 10 });
    if (!r1.shouldReorder || r1.suggestedQty <= 0) throw new Error('Expected reorder suggestion for low stock');

    const r2 = computeReorderSuggestion({ currentStock: 25, reorderPoint: 20, moq: 5 });
    if (r2.shouldReorder) throw new Error('Did not expect reorder suggestion when stock above reorder point');

    const transfer = buildTransferRecord({
      orderId: 'order-900',
      productId: 'prod-900',
      quantity: 10,
      sourceLocationId: 'WH-A',
      destinationLocationId: 'WH-C',
      tenantId: 'test-tenant',
    });
    if (transfer.sourceLocationId !== 'WH-A' || transfer.destinationLocationId !== 'WH-C') throw new Error('Transfer locations normalized incorrectly');

    const workflow = buildPickPackShipWorkflow('test-tenant');
    const summary = buildWarehouseSummary(workflow);
    if (summary.totalTransfers !== 1 || summary.transfersPending !== 1) throw new Error('Expected one pending transfer in workflow summary');

    const count = await createCycleCount('test-tenant', { name: 'Round 1', locationId: 'WH-A', expectedQuantities: [{ sku: 'prod-100', expected: 20 }], countedBy: 'qa-user' });
    if (!count.cycleCountId || count.tenantId !== 'test-tenant') throw new Error('Cycle count creation failed');

    const counts = await getCycleCounts('test-tenant');
    if (counts.length === 0) throw new Error('Expected cycle counts list to contain the newly created cycle count');

    const adjustment = await applyCycleCountAdjustment(count.cycleCountId, 'test-tenant', { quantityCounted: 18, expectedQuantity: 20, countedBy: 'qa-user', reason: 'count variance' });
    if (adjustment.adjustment.variance !== -2) throw new Error('Adjustment variance calculation failed');
    if (adjustment.cycleCount.state !== 'adjusted') throw new Error('Cycle count state did not update to adjusted');

    console.log('TICKET-049 round-one inventory tests passed');
    process.exit(0);
  } catch (err) {
    console.error('TICKET-049 tests failed', err);
    process.exit(2);
  }
})();
