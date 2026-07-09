import { computeCommission, createRecurringOrder, listRecurring } from '../server/api/sales/commission-recurring.js';
import { createRFQ, createPOFromRFQ } from '../server/api/purchase/rfq.js';
import { createReceipt, computeLandedCost, matchReceiptToPO } from '../server/api/purchase/receipts.js';

(async () => {
  try {
    const tenant = 'test-tenant';
    // Commission
    const c = computeCommission({ amount: 10000, productCategory: 'default' });
    if (c.commission <= 0) throw new Error('Commission computation failed');

    const rec = await createRecurringOrder(tenant, { partnerId: 'cust-500', lines: [{ productId: 200, quantity: 3, unitPrice: 500 }] });
    if (!rec.recurringId) throw new Error('Recurring creation failed');
    const list = listRecurring(tenant);
    if (!Array.isArray(list) || !list.some((r) => r.recurringId === rec.recurringId)) throw new Error('Recurring listing failed');

    // RFQ -> PO
    const rfq = await createRFQ(tenant, { vendorId: 'vendor-100', lines: [{ productId: 300, quantity: 10, unitPrice: 50 }] });
    if (!rfq.rfqId) throw new Error('RFQ creation failed');
    const po = await createPOFromRFQ(rfq.rfqId, tenant, 'test-user');
    if (!po || !po.rfq) throw new Error('PO conversion failed');

    // Receipt matching & landed cost
    const receipt = await createReceipt(tenant, { poId: po.po?.id || po.po?.odooId || null, lines: [{ productId: 300, qty: 10, unitCost: 50 }] });
    if (!receipt.receiptId) throw new Error('Receipt creation failed');
    const match = await matchReceiptToPO(receipt.receiptId, tenant);
    const landed = await computeLandedCost(receipt.receiptId, tenant, { freight: 100, duty: 50, handling: 10 });
    if (!landed || landed.landedCost <= 0) throw new Error('Landed cost calculation failed');

    console.log('TICKET-051 Round3 tests passed');
    process.exit(0);
  } catch (err) {
    console.error('TICKET-051 Round3 tests failed', err);
    process.exit(2);
  }
})();
