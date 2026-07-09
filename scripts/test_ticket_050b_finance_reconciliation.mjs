import { matchPaymentsToInvoices } from '../server/api/finance/reconciliation.js';

(async () => {
  try {
    const invoices = [
      { invoiceId: 'inv-001', vendorName: 'Alem Traders', amount: 1000, currency: 'ETB' },
      { invoiceId: 'inv-002', vendorName: 'Ethio Supplies', amount: 2500, currency: 'ETB' },
    ];
    const payments = [
      { paymentId: 'pay-001', invoiceId: 'inv-001', amount: 1000, currency: 'ETB' },
      { paymentId: 'pay-002', invoiceId: 'inv-002', amount: 1200, currency: 'ETB' },
      { paymentId: 'pay-003', invoiceId: 'inv-999', amount: 500, currency: 'ETB' },
    ];

    const report = matchPaymentsToInvoices({ invoices, payments });

    if (!report) throw new Error('No report');
    if (report.results.length !== 2) throw new Error('Unexpected number of invoice reports');
    const reconciled = report.results.find((line) => line.invoiceId === 'inv-001');
    if (reconciled.status !== 'reconciled') throw new Error('inv-001 should be reconciled');
    const partial = report.results.find((line) => line.invoiceId === 'inv-002');
    if (partial.status !== 'open' || partial.outstandingAmount !== 1300) throw new Error('inv-002 outstanding mismatch');
    if (!Array.isArray(report.unmatchedPayments) || report.unmatchedPayments.length !== 1) throw new Error('Expected 1 unmatched payment');

    console.log('TICKET-050b finance reconciliation tests passed');
    process.exit(0);
  } catch (err) {
    console.error('TICKET-050b tests failed', err);
    process.exit(2);
  }
})();
