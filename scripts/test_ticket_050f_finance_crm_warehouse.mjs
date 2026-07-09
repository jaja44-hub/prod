import { computeAgingReport } from '../api/finance/aging.js';
import { matchPaymentsToInvoices } from '../api/finance/reconciliation.js';
import { buildSamplePipeline, buildPipelineSummary, createLeadRecord } from '../api/crm/pipeline.js';
import { buildActivityTimeline, buildActivitySummary, createActivityRecord, normalizeActivityEntry } from '../api/crm/activity.js';
import { buildPickPackShipWorkflow, buildWarehouseSummary, createShipmentRecord, normalizeWarehouseAction } from '../api/inventory/warehouse.js';

(async () => {
  try {
    const agingReport = computeAgingReport({
      vendorLines: [
        { invoiceId: 'inv-AP-010', vendorName: 'Skyline Imports', dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(), amount: 8500.5, currency: 'ETB' },
        { invoiceId: 'inv-AP-011', vendorName: 'Dale Distribution', dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45).toISOString(), amount: 11200.0, currency: 'ETB' },
      ],
      customerLines: [
        { invoiceId: 'inv-AR-010', customerName: 'Central Retail', dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 4).toISOString(), amount: 13400.0, currency: 'ETB' },
      ],
    });

    if (agingReport.summary.vendorCount !== 2 || agingReport.summary.customerCount !== 1) {
      throw new Error('Aging report counts mismatch');
    }
    if (agingReport.summary.totalPayable !== 19700.5) {
      throw new Error('Aging report payable total mismatch');
    }
    if (!agingReport.accountsPayable.days60.length) {
      throw new Error('Aging report bucket distribution unexpected');
    }

    const reconciliation = matchPaymentsToInvoices({
      invoices: [
        { invoiceId: 'inv-001', amount: 1000, currency: 'ETB' },
        { invoiceId: 'inv-002', amount: 2200, currency: 'ETB' },
      ],
      payments: [
        { paymentId: 'pay-001', invoiceId: 'inv-001', amount: 1000, currency: 'ETB' },
        { paymentId: 'pay-002', invoiceId: 'inv-003', amount: 500, currency: 'ETB' },
      ],
    });

    if (reconciliation.results.length !== 2) throw new Error('Reconciliation results length mismatch');
    if (reconciliation.unmatchedPayments.length !== 1) throw new Error('Reconciliation unmatched payment count mismatch');
    if (reconciliation.results.find((r) => r.invoiceId === 'inv-001').status !== 'reconciled') {
      throw new Error('Reconciliation status mismatch for fully paid invoice');
    }

    const pipeline = buildSamplePipeline('test-tenant');
    const pipelineSummary = buildPipelineSummary(pipeline);
    if (pipeline.leads.length !== 2 || pipeline.opportunities.length !== 2) throw new Error('CRM pipeline shape mismatch');
    if (pipelineSummary.totalPipelineValue !== 25500) throw new Error('CRM pipeline total value mismatch');

    const lead = createLeadRecord({ company: 'Test Co', contact: 'Sara', value: 0 });
    if (lead.stage !== 'new' || lead.company !== 'Test Co') throw new Error('CRM lead normalization issue');

    const timeline = buildActivityTimeline('test-tenant');
    if (timeline.length !== 4) throw new Error('CRM activity timeline shape mismatch');
    const activitySummary = buildActivitySummary(timeline);
    if (activitySummary.attachmentCount !== 1) throw new Error('CRM activity attachment count mismatch');

    const activity = createActivityRecord({ type: 'meeting', subject: 'Project sync', performedBy: 'sales_rep' });
    if (activity.type !== 'meeting' || activity.subject !== 'Project sync') {
      throw new Error('CRM activity creation failed');
    }

    const normalizedAction = normalizeWarehouseAction({ type: 'pick', orderId: 'order-900', quantity: 11 });
    if (normalizedAction.type !== 'pick' || normalizedAction.orderId !== 'order-900') {
      throw new Error('Warehouse action normalization failed');
    }

    const workflow = buildPickPackShipWorkflow('test-tenant');
    const workflowSummary = buildWarehouseSummary(workflow);
    if (workflowSummary.totalPicks !== 2 || workflowSummary.totalShipments !== 1) {
      throw new Error('Warehouse workflow counts mismatch');
    }

    const shipment = createShipmentRecord({ orderId: 'order-900', carrier: 'UPS', trackingNumber: 'UPS-900' });
    if (shipment.type !== 'shipment' || shipment.carrier !== 'UPS') {
      throw new Error('Warehouse shipment record creation failed');
    }

    console.log('TICKET-050f Finance/CRM/Warehouse tests passed');
    process.exit(0);
  } catch (err) {
    console.error('TICKET-050f tests failed', err);
    process.exit(2);
  }
})();
