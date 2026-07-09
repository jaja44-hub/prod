import { buildPickPackShipWorkflow, buildWarehouseSummary, createShipmentRecord, normalizeWarehouseAction } from '../api/inventory/warehouse.js';

(async () => {
  try {
    const workflow = buildPickPackShipWorkflow('test-tenant');
    if (!workflow || workflow.picks.length !== 2 || workflow.packs.length !== 1 || workflow.shipments.length !== 1) {
      throw new Error('Unexpected workflow shape');
    }

    const summary = buildWarehouseSummary(workflow);
    if (summary.totalPicks !== 2 || summary.totalPacks !== 1 || summary.totalShipments !== 1) {
      throw new Error('Warehouse summary counts incorrect');
    }
    if (summary.readyToPick !== 1 || summary.shipmentsInTransit !== 1) {
      throw new Error('Warehouse summary status aggregates incorrect');
    }

    const normalized = normalizeWarehouseAction({ type: 'pick', orderId: 'order-200', quantity: 15 });
    if (normalized.type !== 'pick' || normalized.orderId !== 'order-200' || normalized.quantity !== 15) {
      throw new Error('Normalization failed');
    }

    const shipment = createShipmentRecord({ orderId: 'order-200', carrier: 'FedEx', trackingNumber: 'FDX-12345' });
    if (shipment.type !== 'shipment' || shipment.carrier !== 'FedEx' || !shipment.trackingNumber.startsWith('FDX-')) {
      throw new Error('Shipment record creation failed');
    }

    console.log('TICKET-050e Warehouse pick/pack/ship tests passed');
    process.exit(0);
  } catch (err) {
    console.error('TICKET-050e tests failed', err);
    process.exit(2);
  }
})();
