import { computeAgingReport } from '../api/finance/aging.js';

(async () => {
  try {
    const report = computeAgingReport({
      vendorLines: [
        { invoiceId: 'inv-AP-001', dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(), amount: 1000 },
        { invoiceId: 'inv-AP-002', dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 40).toISOString(), amount: 2000 },
      ],
      customerLines: [
        { invoiceId: 'inv-AR-001', dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toISOString(), amount: 1500 },
      ],
    });

    if (!report || !report.accountsPayable || !report.accountsReceivable) throw new Error('Missing aging buckets');
    if (report.summary.totalPayable !== 3000) throw new Error('Vendor total mismatch');
    if (report.summary.totalReceivable !== 1500) throw new Error('Customer total mismatch');
    if (!Array.isArray(report.accountsPayable.days30) || report.accountsPayable.days30.length === 0) throw new Error('Expected AP aging bucket');

    console.log('TICKET-050a finance aging tests passed');
    process.exit(0);
  } catch (err) {
    console.error('TICKET-050a tests failed', err);
    process.exit(2);
  }
})();
