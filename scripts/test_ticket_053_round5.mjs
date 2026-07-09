import { computeValuation, snapshotInventory, getSnapshots } from '../server/api/inventory/valuation.js';
import { createBatch, importBankFeed, listBatches } from '../server/api/finance/payment-batching.js';
import { generateLabel, listLabels } from '../server/api/shipping/label-service.js';

(async () => {
  try {
    // Inventory valuation
    const items = [
      { productId: 'p1', qty: 10, unitCost: 5, receivedAt: new Date(Date.now()-1000*60*60*24*10).toISOString() },
      { productId: 'p1', qty: 5, unitCost: 6, receivedAt: new Date(Date.now()-1000*60*60*24*2).toISOString() },
    ];
    const fifo = computeValuation({ items, method: 'fifo' });
    const lifo = computeValuation({ items, method: 'lifo' });
    if (fifo.total === 0 || lifo.total === 0) throw new Error('Valuation compute failed');
    const snap = snapshotInventory('test-snap', items);
    const snaps = getSnapshots();
    if (!snaps.some(s => s.id === snap.id)) throw new Error('Snapshot failed');

    // Payment batching
    const payments = [ { paymentId: 'pay-1', amount: 100, currency: 'USD' }, { paymentId: 'pay-2', amount: 200, currency: 'USD' } ];
    const batch = createBatch(payments, { batchSize: 2 });
    if (!batch.id) throw new Error('Batch creation failed');
    const feed = importBankFeed([ { bankRef: 'br-1', amount: 150, currency: 'USD', date: new Date().toISOString(), reference: 'INV-1' } ]);
    if (!Array.isArray(feed) || feed.length === 0) throw new Error('Bank feed import failed');

    // Shipping label
    const lbl = generateLabel({ toAddress: 'P.O. Box 1000, Addis' }, 'ethiopost');
    if (!lbl.id || !lbl.tracking) throw new Error('Label generation failed');

    console.log('TICKET-053 Round5 tests passed');
    process.exit(0);
  } catch (err) {
    console.error('TICKET-053 Round5 tests failed', err);
    process.exit(2);
  }
})();
