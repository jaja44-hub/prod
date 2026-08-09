function daysAgo(n) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();
}

function hoursAgo(n) {
  return new Date(Date.now() - n * 60 * 60 * 1000).toISOString();
}

function daysAhead(n) {
  return new Date(Date.now() + n * 24 * 60 * 60 * 1000).toISOString();
}

export function buildSalesOrdersSeed(tenantId = 'production') {
  const partners = [
    'Addis Wholesale', 'Ethio Retail', 'Bole Traders', 'Mercato Distributors',
    'Hawassa Chain', 'Dire Dawa Merchants', 'Bahir Dar Foods', 'Jimma Traders',
    'Adama Logistics', 'Gondar Supplies', 'Mekelle Retail', 'Hosaena Market',
    'Shashemene Coop', 'Debre Berhan Trade', 'Arba Minch Stores',
  ];
  const states = ['draft', 'confirmed', 'packed', 'in_transit', 'delivered', 'invoiced'];
  const records = partners.map((partner, index) => {
    const qty = 3 + (index % 12);
    const unitPrice = 850 + (index * 175);
    const amount = qty * unitPrice;
    return {
      id: `seed-${tenantId}-ord-${100 + index}`,
      name: `SO-${2026}${100 + index} ${partner}`,
      partnerId: `partner-${String(index + 1).padStart(3, '0')}`,
      partnerName: partner,
      lines: [{ quantity: qty, unitPrice, productId: `prod-${(index % 8) + 100}` }],
      amount_total: amount,
      amountTotal: amount,
      state: states[index % states.length],
      tenantId,
      createdAt: daysAgo(30 - index),
      confirmedAt: index > 2 ? daysAgo(28 - index) : null,
      shippedAt: index > 5 ? daysAgo(20 - index) : null,
    };
  });
  return { tenantId, datasetKey: 'sales_orders', schemaVersion: 2, records };
}

export function buildFinanceAgingSeed(tenantId = 'production') {
  const vendorLines = [
    { invoiceId: 'ap-001', vendorName: 'Zenith Supplies', dueDate: daysAgo(5), amount: 6200.5, currency: 'ETB' },
    { invoiceId: 'ap-002', vendorName: 'Rhino Logistics', dueDate: daysAgo(35), amount: 18200.0, currency: 'ETB' },
    { invoiceId: 'ap-003', vendorName: 'Alem Pharma', dueDate: daysAgo(110), amount: 4700.25, currency: 'ETB' },
    { invoiceId: 'ap-004', vendorName: 'Mulu Motors', dueDate: daysAhead(8), amount: 9200.0, currency: 'ETB' },
    { invoiceId: 'ap-005', vendorName: 'Blue Nile Packaging', dueDate: daysAgo(22), amount: 11450.0, currency: 'ETB' },
    { invoiceId: 'ap-006', vendorName: 'East Africa Freight', dueDate: daysAgo(68), amount: 23800.0, currency: 'ETB' },
    { invoiceId: 'ap-007', vendorName: 'Kality Industrial', dueDate: daysAgo(14), amount: 15600.0, currency: 'ETB' },
    { invoiceId: 'ap-008', vendorName: 'Sheger Import', dueDate: daysAgo(42), amount: 32100.0, currency: 'ETB' },
    { invoiceId: 'ap-009', vendorName: 'Entoto Trading', dueDate: daysAhead(12), amount: 7800.0, currency: 'ETB' },
    { invoiceId: 'ap-010', vendorName: 'Bishoftu Agro', dueDate: daysAgo(95), amount: 19450.0, currency: 'ETB' },
  ];
  const customerLines = [
    { invoiceId: 'ar-001', customerName: 'Addis Wholesale', dueDate: daysAhead(10), amount: 14000.75, currency: 'ETB' },
    { invoiceId: 'ar-002', customerName: 'Ethio Retail', dueDate: daysAgo(20), amount: 7600.0, currency: 'ETB' },
    { invoiceId: 'ar-003', customerName: 'Bole Traders', dueDate: daysAgo(45), amount: 13250.0, currency: 'ETB' },
    { invoiceId: 'ar-004', customerName: 'Mercato Distributors', dueDate: daysAgo(12), amount: 9800.0, currency: 'ETB' },
    { invoiceId: 'ar-005', customerName: 'Hawassa Chain Stores', dueDate: daysAhead(18), amount: 22100.0, currency: 'ETB' },
    { invoiceId: 'ar-006', customerName: 'Dire Dawa Merchants', dueDate: daysAgo(33), amount: 16750.0, currency: 'ETB' },
    { invoiceId: 'ar-007', customerName: 'Bahir Dar Foods', dueDate: daysAgo(7), amount: 5400.0, currency: 'ETB' },
    { invoiceId: 'ar-008', customerName: 'Jimma Traders', dueDate: daysAhead(25), amount: 28900.0, currency: 'ETB' },
    { invoiceId: 'ar-009', customerName: 'Adama Logistics', dueDate: daysAgo(55), amount: 11200.0, currency: 'ETB' },
    { invoiceId: 'ar-010', customerName: 'Gondar Supplies', dueDate: daysAgo(3), amount: 4350.0, currency: 'ETB' },
  ];
  return { tenantId, datasetKey: 'finance_aging', schemaVersion: 2, vendorLines, customerLines };
}

export function buildWarehouseWorkflowSeed(tenantId = 'production') {
  const picks = Array.from({ length: 12 }, (_, i) => ({
    pickId: `pick-${String(i + 1).padStart(3, '0')}`,
    orderId: `order-${103 + i}`,
    productId: `prod-${100 + (i % 6)}`,
    sku: `SKU-${['TEFF', 'OIL', 'SPICE', 'GRAIN', 'COFFEE', 'HONEY'][i % 6]}-${String(i + 1).padStart(2, '0')}`,
    quantity: 4 + (i % 9),
    status: ['ready', 'in_progress', 'ready', 'assigned'][i % 4],
    location: i % 2 === 0 ? 'WH-A / Aisle A' : 'WH-B / Pick Face',
    tenantId,
    dueAt: hoursAgo(-(4 + i)),
  }));
  const packs = Array.from({ length: 8 }, (_, i) => ({
    packId: `pack-${300 + i}`,
    orderId: `order-${101 + i}`,
    packageType: i % 3 === 0 ? 'pallet' : 'box',
    weightKg: Number((4.2 + i * 1.8).toFixed(1)),
    status: 'packed',
    tenantId,
    packedAt: hoursAgo(2 + i),
  }));
  const shipments = Array.from({ length: 10 }, (_, i) => ({
    shipmentId: `ship-${500 + i}`,
    orderId: `order-${100 + i}`,
    carrier: ['DHL', 'Ethio Post', 'Rhino Logistics', 'FedEx', 'Local Courier'][i % 5],
    trackingNumber: `TRK-${5000 + i}`,
    status: i % 4 === 0 ? 'delivered' : 'in_transit',
    shippedAt: hoursAgo(8 + i * 3),
    estimatedDelivery: hoursAgo(-(12 + i)),
    tenantId,
  }));
  const transfers = Array.from({ length: 10 }, (_, i) => ({
    transferId: `transfer-${100 + i}`,
    orderId: `order-${108 + i}`,
    productId: `prod-${110 + (i % 5)}`,
    type: ['internal_transfer', 'receipt', 'pick', 'return'][i % 4],
    location: i % 2 === 0 ? 'WH-A → WH-B' : 'Vendor Dock → WH-A',
    quantity: 10 + i * 6,
    sourceLocationId: i % 2 === 0 ? 'WH-A' : 'Vendor Dock',
    destinationLocationId: i % 2 === 0 ? 'WH-B' : 'WH-A',
    status: ['pending', 'in_progress', 'completed'][i % 3],
    tenantId,
    timestamp: hoursAgo(1 + i * 2),
    createdAt: hoursAgo(1 + i * 2),
    expectedAt: hoursAgo(-(6 + i)),
  }));
  return { tenantId, datasetKey: 'warehouse_workflow', schemaVersion: 2, picks, packs, shipments, transfers };
}

export function buildPurchaseSeed(tenantId = 'production') {
  const vendors = ['ven-001', 'ven-002', 'ven-003', 'ven-004', 'ven-005', 'ven-006'];
  const records = Array.from({ length: 12 }, (_, i) => ({
    vendorId: vendors[i % vendors.length],
    poId: `PO-${1001 + i}`,
    expectedDate: daysAgo(20 - i),
    receivedDate: daysAgo(18 - i),
    expectedQty: 40 + i * 8,
    receivedQty: 38 + i * 8,
    expectedAmount: 80000 + i * 22000,
    paidAmount: 79000 + i * 22500,
    tenantId,
  }));
  return { tenantId, datasetKey: 'purchase_data', schemaVersion: 2, purchases: records };
}

export function buildCycleCountsSeed(tenantId = 'production') {
  const locations = ['WH-A / Aisle A', 'WH-B / Bulk', 'WH-A / Cold', 'WH-B / Pick Face', 'WH-C / Returns', 'WH-A / High Value', 'WH-B / Overflow', 'WH-A / Quarantine'];
  const states = ['verified', 'review', 'pending', 'adjusted', 'draft', 'in_progress'];
  const records = locations.map((locationId, i) => ({
    cycleCountId: `seed-${tenantId}-cc-${i + 1}`,
    name: `Cycle count ${locationId}`,
    locationId,
    state: states[i % states.length],
    createdAt: daysAgo(10 - i),
    dueDate: daysAhead(2 + i),
    expectedQuantities: [{ sku: `SKU-${i + 1}`, qty: 50 + i * 35 }],
    countedBy: ['inventory_lead', 'warehouse_supervisor', 'cycle_counter_02'][i % 3],
    adjustments: i % 4 === 0 ? [{ adjustmentId: `adj-${i}`, variance: -2 + i }] : [],
    tenantId,
  }));
  return { tenantId, datasetKey: 'cycle_counts', schemaVersion: 2, records };
}

export function buildCrmPipelineSeed(tenantId = 'production') {
  const leads = Array.from({ length: 10 }, (_, i) => ({
    leadId: `lead-${String(i + 1).padStart(3, '0')}`,
    company: ['Nile Tech', 'Blue Ridge Trading', 'Harmony Logistics', 'Ethio FMCG', 'Sheger Foods', 'Entoto Retail', 'Kality Pharma', 'Bole Mart', 'Mercato Prime', 'Adama Trade'][i],
    contact: `Contact ${i + 1}`,
    stage: ['new', 'qualified', 'contacted'][i % 3],
    value: i * 2500,
    owner: ['sales_manager', 'sales_executive', 'sales_head'][i % 3],
    createdAt: daysAgo(25 - i),
    tenantId,
  }));
  const opportunities = Array.from({ length: 12 }, (_, i) => ({
    opportunityId: `opp-${100 + i}`,
    company: leads[i % leads.length].company,
    amount: 5000 + i * 3200,
    stage: ['proposal', 'negotiation', 'qualified', 'won'][i % 4],
    owner: ['sales_head', 'sales_manager'][i % 2],
    expectedClose: daysAhead(10 + i * 3),
    lastActivity: daysAgo(3 + i),
    tenantId,
  }));
  return { tenantId, datasetKey: 'crm_pipeline', schemaVersion: 2, leads, opportunities };
}

export function buildCrmActivitySeed(tenantId = 'production') {
  const types = ['email', 'call', 'meeting', 'attachment'];
  const timeline = Array.from({ length: 15 }, (_, i) => ({
    activityId: `act-${String(i + 1).padStart(3, '0')}`,
    type: types[i % types.length],
    subject: [
      'Introductory CRM workflow review',
      'Discovery call with importer',
      'Qualification review',
      'Proposal document uploaded',
      'Negotiation follow-up',
      'Contract review meeting',
      'Pricing discussion',
      'Delivery terms alignment',
      'Credit limit review',
      'Quarterly business review',
      'New SKU introduction',
      'Returns policy discussion',
      'Payment terms negotiation',
      'Warehouse slot planning',
      'Annual forecast session',
    ][i],
    direction: ['outbound', 'inbound', 'internal'][i % 3],
    performedBy: ['sales_rep', 'sales_manager', 'sales_head'][i % 3],
    contact: leadsContact(i),
    occurredAt: hoursAgo(4 + i * 5),
    tenantId,
  }));
  return { tenantId, datasetKey: 'crm_activity', schemaVersion: 2, timeline };
}

function leadsContact(i) {
  return ['Addis Importers', 'Nile Tech', 'Harmony Logistics', 'Ethio FMCG', 'Bole Traders'][i % 5];
}

export function buildInventoryMovementsSeed(tenantId = 'production') {
  const types = ['sale', 'purchase', 'transfer', 'receipt', 'return', 'adjustment'];
  const records = Array.from({ length: 18 }, (_, i) => ({
    movementId: `move-${String(i + 1).padStart(3, '0')}`,
    productId: `prod-${100 + (i % 8)}`,
    qty: i % 2 === 0 ? -(4 + i) : (20 + i * 3),
    type: types[i % types.length],
    sourceLocation: i % 2 === 0 ? 'WH-A / Shelf 12' : 'Vendor Dock',
    destinationLocation: i % 2 === 0 ? 'Customer Site' : 'WH-B / Receiving',
    timestamp: hoursAgo(2 + i * 4),
    tenantId,
  }));
  return { tenantId, datasetKey: 'inventory_movements', schemaVersion: 2, records };
}

export function buildModuleEventsSeed(tenantId = 'production') {
  const events = [
    { id: 'evt-wh-001', moduleId: 'warehouse', action: '12 picks queued across WH-A and WH-B', sourceModel: 'inventory.picking', sourceId: 'ship-501', ts: hoursAgo(1) },
    { id: 'evt-fin-001', moduleId: 'finance', action: 'AR/AP aging refreshed for production tenant', sourceModel: 'accounting.move', sourceId: 'ap-001', ts: hoursAgo(3) },
    { id: 'evt-sales-001', moduleId: 'sales', action: '15 active sales orders contributing to revenue', sourceModel: 'sales.order', sourceId: 'ord-101', ts: hoursAgo(5) },
    { id: 'evt-purchase-001', moduleId: 'purchase', action: '12 purchase receipts tracked across 6 vendors', sourceModel: 'purchase.order', sourceId: 'PO-1001', ts: hoursAgo(7) },
    { id: 'evt-inv-001', moduleId: 'inventory', action: '8 cycle counts scheduled across warehouse zones', sourceModel: 'inventory.inventory', sourceId: 'cc-batch-01', ts: hoursAgo(9) },
    { id: 'evt-crm-001', moduleId: 'crm', action: '12 opportunities in active pipeline stages', sourceModel: 'crm.lead', sourceId: 'opp-101', ts: hoursAgo(11) },
    { id: 'evt-wh-002', moduleId: 'warehouse', action: '10 shipments in transit with carrier tracking', sourceModel: 'inventory.picking', sourceId: 'ship-510', ts: hoursAgo(13) },
    { id: 'evt-fin-002', moduleId: 'finance', action: 'Receivables past 30 days flagged for review', sourceModel: 'accounting.move', sourceId: 'ar-003', ts: hoursAgo(15) },
  ];
  return { tenantId, datasetKey: 'module_events', schemaVersion: 2, events };
}

export const PRODUCTION_SEED_CATALOG = {
  sales_orders: buildSalesOrdersSeed,
  finance_aging: buildFinanceAgingSeed,
  warehouse_workflow: buildWarehouseWorkflowSeed,
  purchase_data: buildPurchaseSeed,
  cycle_counts: buildCycleCountsSeed,
  crm_pipeline: buildCrmPipelineSeed,
  crm_activity: buildCrmActivitySeed,
  inventory_movements: buildInventoryMovementsSeed,
  module_events: buildModuleEventsSeed,
};

export function buildAllProductionSeeds(tenantId = 'production') {
  return Object.fromEntries(
    Object.entries(PRODUCTION_SEED_CATALOG).map(([key, builder]) => [key, builder(tenantId)])
  );
}
