import { logAuditEvent } from '../server/api/audit/logging.js';
import { snapshotInventory } from '../server/api/inventory/valuation.js';
import { createReceipt } from '../server/api/purchase/receipts.js';
import { createBatch } from '../server/api/finance/payment-batching.js';
import { getDocuments } from '../server/api/system/persistence.js';

(async () => {
  try {
    const ev = logAuditEvent({ actor: 'round7', action: 'persistence-test' });
    const snap = snapshotInventory('round7-snap', [{ productId: 'p1', qty: 1, unitCost: 1 }]);
    const receipt = await createReceipt('test-tenant', { poId: 'po-rt7', lines: [{ productId: 'p1', qty: 1, unitCost: 1 }] });
    const batch = createBatch([{ paymentId: 'p-rt7', amount: 10 }], { batchFor: 'round7' });

    // allow short delay for async persistence writes
    await new Promise((r) => setTimeout(r, 200));

    const audits = await getDocuments('audit');
    const snaps = await getDocuments('snapshots');
    const receipts = await getDocuments('receipts');
    const batches = await getDocuments('batches');

    if (!Array.isArray(audits) || audits.length === 0) throw new Error('Audits not persisted');
    if (!Array.isArray(snaps) || snaps.length === 0) throw new Error('Snapshots not persisted');
    if (!Array.isArray(receipts) || receipts.length === 0) throw new Error('Receipts not persisted');
    if (!Array.isArray(batches) || batches.length === 0) throw new Error('Batches not persisted');

    console.log('TICKET-055 Round7 persistence tests passed');
    process.exit(0);
  } catch (err) {
    console.error('TICKET-055 Round7 tests failed', err);
    process.exit(2);
  }
})();
