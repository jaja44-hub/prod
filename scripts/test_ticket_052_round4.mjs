import { computeVendorScore } from '../server/api/purchase/vendor-performance.js';
import { matchPaymentsToInvoices } from '../server/api/finance/reconciliation.js';
import { computeAgingMultiCurrency } from '../server/api/finance/aging.js';

(async () => {
  try {
    const purchases = [
      { vendorId: 'v-1', poId: 'po-1', expectedDate: new Date(Date.now()-1000*60*60*24*2).toISOString(), receivedDate: new Date(Date.now()-1000*60*60*24*1).toISOString(), expectedQty: 100, receivedQty: 100, expectedAmount: 1000, paidAmount: 1000 },
      { vendorId: 'v-1', poId: 'po-2', expectedDate: new Date(Date.now()-1000*60*60*24*10).toISOString(), receivedDate: new Date(Date.now()-1000*60*60*24*20).toISOString(), expectedQty: 50, receivedQty: 45, expectedAmount: 500, paidAmount: 520 },
      { vendorId: 'v-2', poId: 'po-3', expectedDate: new Date(Date.now()+1000*60*60*24*5).toISOString(), receivedDate: null, expectedQty: 30, receivedQty: 0, expectedAmount: 300, paidAmount: 0 },
    ];

    const vendorReport = computeVendorScore({ purchases });
    if (!vendorReport.vendors || vendorReport.vendors.length < 2) throw new Error('Vendor report failed');

    const invoices = [ { invoiceId: 'inv-1', amount: 1000, currency: 'USD', reference: 'PO-1' }, { invoiceId: 'inv-2', amount: 500, currency: 'USD', reference: 'PO-2' } ];
    const payments = [ { paymentId: 'pay-1', amount: 600, currency: 'USD', invoiceId: 'inv-1' }, { paymentId: 'pay-2', amount: 400, currency: 'USD', reference: 'PO-2' } ];
    const rec = matchPaymentsToInvoices({ invoices, payments });
    if (!rec.results || rec.unmatchedPayments.length !== 0) throw new Error('Reconciliation failed');

    const aging = computeAgingMultiCurrency({ vendorLines: [ { invoiceId: 'ap-1', dueDate: new Date(Date.now()-1000*60*60*24*40).toISOString(), amount: 1000, currency: 'USD' } ], customerLines: [], fxRates: { USD: 55 } });
    if (!aging || !aging.accountsPayable) throw new Error('Aging multi-currency failed');

    console.log('TICKET-052 Round4 tests passed');
    process.exit(0);
  } catch (err) {
    console.error('TICKET-052 Round4 tests failed', err);
    process.exit(2);
  }
})();
