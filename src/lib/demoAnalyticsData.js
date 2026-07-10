export function buildDemoAnalyticsSnapshot({ tenantId = 'production' } = {}) {
  return {
    tenantId,
    generatedAt: new Date().toISOString(),
    summary: {
      totalRevenue: 2840000,
      totalOrders: 184,
      totalPipelineValue: 1860000,
      totalReceivable: 145000,
      totalPayable: 92000,
      warehouseHealth: 34,
      financeHealth: 'healthy',
    },
    modules: {
      sales: {
        name: 'Sales',
        score: 82,
        trend: 8,
        metrics: {
          revenue: 2840000,
          orders: 184,
          averageOrderValue: 15435,
        },
        chartData: [
          { name: 'Jan', value: 520000 },
          { name: 'Feb', value: 610000 },
          { name: 'Mar', value: 650000 },
          { name: 'Apr', value: 720000 },
        ],
        breakdown: [
          { name: 'Orders', value: 184, color: '#7c3aed' },
          { name: 'Revenue', value: 2840000, color: '#0ea5e9' },
        ],
      },
      crm: {
        name: 'CRM',
        score: 78,
        trend: 7,
        metrics: {
          leads: 94,
          opportunities: 37,
          pipelineValue: 1860000,
        },
      },
      purchase: {
        name: 'Purchase',
        score: 74,
        trend: 4,
        metrics: {
          vendors: 14,
          onTimePct: 92,
          avgQtyAccuracy: 95,
        },
      },
      warehouse: {
        name: 'Warehouse',
        score: 87,
        trend: 9,
        metrics: {
          readyToPick: 34,
          packedCount: 26,
          shipmentsInTransit: 18,
        },
        chartData: [
          { name: 'Mon', ready: 12, packed: 8, shipped: 7 },
          { name: 'Tue', ready: 14, packed: 10, shipped: 8 },
          { name: 'Wed', ready: 16, packed: 12, shipped: 10 },
          { name: 'Thu', ready: 18, packed: 14, shipped: 12 },
          { name: 'Fri', ready: 20, packed: 15, shipped: 13 },
        ],
        breakdown: [
          { name: 'Ready to pick', value: 34, color: '#7c3aed' },
          { name: 'Packed', value: 26, color: '#0ea5e9' },
          { name: 'In transit', value: 18, color: '#f59e0b' },
        ],
      },
      finance: {
        name: 'Finance',
        score: 84,
        trend: 6,
        metrics: {
          totalReceivable: 145000,
          totalPayable: 92000,
          margin: 18.4,
        },
        chartData: [
          { name: 'Jan', receivable: 120000, payable: 85000 },
          { name: 'Feb', receivable: 128000, payable: 89000 },
          { name: 'Mar', receivable: 136000, payable: 91000 },
          { name: 'Apr', receivable: 145000, payable: 92000 },
        ],
        breakdown: [
          { name: 'Receivables', value: 145000, color: '#7c3aed' },
          { name: 'Payables', value: 92000, color: '#0ea5e9' },
          { name: 'Margin', value: 18.4, color: '#f59e0b' },
        ],
      },
    },
    insights: [
      {
        title: 'Revenue pulse',
        detail: 'The current tenant is showing strong recurring revenue momentum and healthy order volume.',
        severity: 'positive',
      },
      {
        title: 'Warehouse readiness',
        detail: '34 orders are ready to pick and dispatch, which is above the recent weekly average.',
        severity: 'positive',
      },
    ],
  };
}

export function buildDemoWarehouseWorkflow() {
  return {
    success: true,
    tenantId: 'production',
    workflow: {
      report: {
        summary: {
          totalOrders: 24,
          pickingCount: 15,
          packingCount: 7,
          shippedCount: 2,
        },
        shipments: [
          { shipmentId: 'SHIP-9001', carrier: 'DHL', trackingNumber: 'DHL-9001', status: 'in_transit' },
          { shipmentId: 'SHIP-9002', carrier: 'FedEx', trackingNumber: 'FED-9002', status: 'delivered' },
        ],
        movements: [
          { type: 'Transfer', location: 'WH-A', quantity: 12, timestamp: '2h ago' },
          { type: 'Receipt', location: 'WH-B', quantity: 25, timestamp: '4h ago' },
        ],
        workflow: [
          { id: 'wf-1', status: 'ready', orderId: 'ORD-1001', sku: 'SKU-01', quantity: 12 },
          { id: 'wf-2', status: 'packed', orderId: 'ORD-1002', sku: 'SKU-02', quantity: 5 },
          { id: 'wf-3', status: 'shipped', orderId: 'ORD-1003', sku: 'SKU-03', quantity: 8 },
        ],
      },
    },
    summary: {
      totalPicks: 15,
      totalPacks: 7,
      totalShipments: 2,
      readyToPick: 12,
      packedCount: 7,
      shipmentsInTransit: 1,
    },
  };
}

export function buildDemoCycleCounts() {
  return [
    { id: 'cc-1', state: 'verified' },
    { id: 'cc-2', state: 'review' },
    { id: 'cc-3', state: 'pending' },
  ];
}

export function buildDemoAgingReport() {
  return {
    success: true,
    tenantId: 'production',
    report: {
      summary: {
        totalPayable: 92000,
        totalReceivable: 145000,
        vendorCount: 3,
        customerCount: 2,
      },
      accountsPayable: {
        current: [{ invoiceId: 'INV-AP-01' }],
        days30: [{ invoiceId: 'INV-AP-02' }],
        days60: [{ invoiceId: 'INV-AP-03' }],
      },
      accountsReceivable: {
        current: [{ invoiceId: 'INV-AR-01' }],
        days30: [{ invoiceId: 'INV-AR-02' }],
      },
    },
  };
}
