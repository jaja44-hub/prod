import { buildSeededFinanceAgingData } from '../finance/aging.js';
import { buildSeededPurchaseData } from '../purchase/vendor-performance.js';
import { seedSalesOrders } from '../sales/orders.js';
import { buildPickPackShipWorkflow } from '../inventory/warehouse.js';

export function buildSeededFinanceTransactions(tenantId = 'production') {
  const finance = buildSeededFinanceAgingData(tenantId);
  const salesOrders = seedSalesOrders(tenantId);
  const salesRevenue = salesOrders.reduce((sum, order) => sum + Number(order.amount_total || 0), 0);
  const receivableTotal = finance.report?.summary?.totalReceivable || 0;

  return {
    transactions: [
      { amount: salesRevenue, currency: 'ETB', source: 'sales_orders', tenantId },
      { amount: receivableTotal, currency: 'ETB', source: 'accounts_receivable', tenantId },
      { amount: 15000, currency: 'USD', source: 'export_sales', tenantId },
    ],
    costItems: [
      { amount: Math.round(salesRevenue * 0.58), category: 'cogs', tenantId },
      { amount: 42000, category: 'overhead', tenantId },
      { amount: 28500, category: 'labor', tenantId },
      { amount: finance.report?.summary?.totalPayable || 0, category: 'payables', tenantId },
    ],
  };
}

export function buildModuleActivityEvents(tenantId = 'production') {
  const warehouse = buildPickPackShipWorkflow(tenantId);
  const finance = buildSeededFinanceAgingData(tenantId);
  const sales = seedSalesOrders(tenantId);
  const purchase = buildSeededPurchaseData(tenantId);
  const now = Date.now();

  return [
    {
      id: 'evt-wh-001',
      moduleId: 'warehouse',
      action: `${warehouse.picks.length} picks queued, ${warehouse.shipments.length} shipments in transit`,
      odooModel: 'stock.picking',
      odooId: warehouse.shipments[0]?.shipmentId || 'ship-501',
      ts: new Date(now - 1000 * 60 * 18),
    },
    {
      id: 'evt-fin-001',
      moduleId: 'finance',
      action: `AR ${finance.report.summary.totalReceivable.toLocaleString('en-ET')} ETB · AP ${finance.report.summary.totalPayable.toLocaleString('en-ET')} ETB`,
      odooModel: 'account.move',
      odooId: finance.vendorLines[0]?.invoiceId || 'ap-001',
      ts: new Date(now - 1000 * 60 * 60 * 2),
    },
    {
      id: 'evt-sales-001',
      moduleId: 'sales',
      action: `${sales.length} active orders · latest ${sales[sales.length - 1]?.name || 'order'}`,
      odooModel: 'sale.order',
      odooId: sales[0]?.id || 'ord-001',
      ts: new Date(now - 1000 * 60 * 60 * 5),
    },
    {
      id: 'evt-purchase-001',
      moduleId: 'purchase',
      action: `${purchase.purchases.length} purchase receipts tracked across vendors`,
      odooModel: 'purchase.order',
      odooId: purchase.purchases[0]?.poId || 'PO-1001',
      ts: new Date(now - 1000 * 60 * 60 * 8),
    },
    {
      id: 'evt-inv-001',
      moduleId: 'inventory',
      action: 'Cycle counts scheduled for WH-A and WH-B locations',
      odooModel: 'stock.inventory',
      odooId: 'cc-batch-01',
      ts: new Date(now - 1000 * 60 * 60 * 12),
    },
  ];
}
