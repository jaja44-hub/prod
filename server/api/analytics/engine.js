import { buildKpiDashboard } from './metrics.js';
import { buildSamplePipeline, buildPipelineSummary } from '../crm/pipeline.js';
import { buildSeededPurchaseData, computeVendorScore } from '../purchase/vendor-performance.js';
import { buildPickPackShipWorkflow, buildWarehouseSummary } from '../inventory/warehouse.js';
import { buildSeededFinanceAgingData, computeAgingReport } from '../finance/aging.js';
import { getOrders } from '../sales/orders.js';
import { buildSeededFinanceTransactions } from '../lib/productionSeed.js';
import { getTenantDataset } from '../lib/moduleDataStore.js';
import { buildCrmPipelineSeed, buildWarehouseWorkflowSeed, buildFinanceAgingSeed, buildPurchaseSeed, buildSalesOrdersSeed } from '../lib/productionSeedCatalog.js';

function normalizeNumber(value) {
  const num = Number(value || 0);
  return Number.isFinite(num) ? num : 0;
}

function buildModuleScore(moduleData = {}) {
  const score = normalizeNumber(moduleData.score);
  const trend = normalizeNumber(moduleData.trend);
  return {
    ...moduleData,
    score,
    trend,
  };
}

async function resolveSalesOrders(tenantId, data = {}) {
  if (Array.isArray(data.salesOrders)) return data.salesOrders;
  if (Array.isArray(data.orders)) return data.orders;
  try {
    const dataset = await getTenantDataset(tenantId, 'sales_orders', buildSalesOrdersSeed);
    return dataset.records || [];
  } catch (err) {
    console.warn('[analytics/engine] failed to read sales orders from Firestore', err?.message || err);
  }
  try {
    const liveOrders = await getOrders(tenantId);
    if (Array.isArray(liveOrders) && liveOrders.length > 0) return liveOrders;
  } catch (err) {
    console.warn('[analytics/engine] failed to read sales orders from API', err?.message || err);
  }
  return [];
}

async function resolveCrmPipeline(tenantId, data = {}) {
  if (data.crmPipeline) return data.crmPipeline;
  if (data.pipeline) return data.pipeline;
  try {
    const dataset = await getTenantDataset(tenantId, 'crm_pipeline', buildCrmPipelineSeed);
    return dataset;
  } catch (err) {
    console.warn('[analytics/engine] failed to read CRM pipeline from Firestore', err?.message || err);
  }
  try {
    return await buildSamplePipeline(tenantId);
  } catch (err) {
    console.warn('[analytics/engine] failed to read CRM pipeline from seed builder', err?.message || err);
    return { leads: [], opportunities: [] };
  }
}

async function resolveWarehouseWorkflow(tenantId, data = {}) {
  if (data.warehouseData) return data.warehouseData;
  if (data.workflow) return data.workflow;
  try {
    // Now calls Odoo proxy via updated warehouse API
    return await buildPickPackShipWorkflow(tenantId);
  } catch (err) {
    console.warn('[analytics/engine] failed to read warehouse workflow from Odoo proxy', err?.message || err);
  }
  try {
    const dataset = await getTenantDataset(tenantId, 'warehouse_workflow', buildWarehouseWorkflowSeed);
    return dataset;
  } catch (err) {
    console.warn('[analytics/engine] failed to read warehouse workflow from Firestore', err?.message || err);
    return { picks: [], packs: [], shipments: [], transfers: [] };
  }
}

export async function buildTenantAnalyticsSnapshot({ tenantId = 'production', data = {} } = {}) {
  const [salesOrders, crmPipeline, warehouseData] = await Promise.all([
    resolveSalesOrders(tenantId, data),
    resolveCrmPipeline(tenantId, data),
    resolveWarehouseWorkflow(tenantId, data),
  ]);

  const salesRevenue = salesOrders.reduce((sum, order) => sum + normalizeNumber(order.amountTotal || order.amount_total || order.amount || 0), 0);
  const salesOrdersCount = salesOrders.length;
  const salesChartData = salesOrders.length > 0
    ? salesOrders.slice(-4).map((order, index) => ({
        name: order.name || order.orderId || `Order ${index + 1}`,
        value: normalizeNumber(order.amountTotal || order.amount_total || order.amount || 0),
      }))
    : [
        { name: 'No orders', value: 0 },
        { name: 'Pending', value: 0 },
        { name: 'Booked', value: 0 },
        { name: 'Ready', value: 0 },
      ];

  const pipelineSummary = buildPipelineSummary(crmPipeline);

  let purchaseData = data.purchaseData || data.purchase;
  if (!purchaseData) {
    try {
      const dataset = await getTenantDataset(tenantId, 'purchase_data', buildPurchaseSeed);
      purchaseData = dataset;
    } catch (err) {
      console.warn('[analytics/engine] failed to read purchase data from Firestore', err?.message || err);
      purchaseData = buildSeededPurchaseData(tenantId);
    }
  }
  const vendorScore = computeVendorScore({ purchases: purchaseData.purchases || [] });

  const warehouseSummary = buildWarehouseSummary(warehouseData);

  let financeData = data.financeData || data.finance;
  if (!financeData) {
    try {
      // Now calls Odoo proxy via updated finance API
      financeData = await buildSeededFinanceAgingData(tenantId);
    } catch (err) {
      console.warn('[analytics/engine] failed to read finance data from Odoo proxy', err?.message || err);
    }
    try {
      const dataset = await getTenantDataset(tenantId, 'finance_aging', buildFinanceAgingSeed);
      financeData = dataset;
    } catch (err) {
      console.warn('[analytics/engine] failed to read finance data from Firestore', err?.message || err);
      financeData = buildSeededFinanceAgingData(tenantId);
    }
  }
  const agingReport = financeData.report?.summary
    ? financeData.report
    : computeAgingReport({ vendorLines: financeData.vendorLines || [], customerLines: financeData.customerLines || [] });

  const financeKpis = buildKpiDashboard({
    transactions: data.transactions || buildSeededFinanceTransactions(tenantId).transactions,
    costItems: data.costItems || buildSeededFinanceTransactions(tenantId).costItems,
    tenantId,
  });

  const warehouseChartData = warehouseSummary.totalPicks > 0
    ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((name, index) => ({
        name,
        ready: Math.max(1, warehouseSummary.readyToPick + index),
        packed: Math.max(1, warehouseSummary.packedCount + Math.max(0, index - 1)),
        shipped: Math.max(1, warehouseSummary.shipmentsInTransit + Math.max(0, index - 2)),
      }))
    : [{ name: 'No activity', ready: 0, packed: 0, shipped: 0 }];

  const receivableTotal = agingReport.summary?.totalReceivable || 0;
  const payableTotal = agingReport.summary?.totalPayable || 0;
  const financeChartData = receivableTotal > 0 || payableTotal > 0
    ? ['Jan', 'Feb', 'Mar', 'Apr'].map((name, index) => ({
        name,
        receivable: Math.round(receivableTotal * (0.72 + index * 0.08)),
        payable: Math.round(payableTotal * (0.68 + index * 0.09)),
      }))
    : [{ name: 'No activity', receivable: 0, payable: 0 }];

  const modules = {
    sales: buildModuleScore({
      name: 'Sales',
      score: salesOrdersCount > 0 ? Math.min(100, Math.round((salesRevenue / 300000) * 100)) : 70,
      trend: salesOrdersCount > 0 ? 8 : 3,
      metrics: {
        revenue: salesRevenue,
        orders: salesOrdersCount,
        averageOrderValue: salesOrdersCount > 0 ? salesRevenue / salesOrdersCount : 0,
      },
      chartData: salesChartData,
      breakdown: [
        { name: 'Orders', value: salesOrdersCount, color: '#7c3aed' },
        { name: 'Revenue', value: salesRevenue, color: '#0ea5e9' },
        { name: 'Avg. order', value: salesOrdersCount > 0 ? salesRevenue / salesOrdersCount : 0, color: '#f59e0b' },
      ],
    }),
    crm: buildModuleScore({
      name: 'CRM',
      score: pipelineSummary.opportunityCount > 0 ? Math.min(100, 60 + pipelineSummary.opportunityCount * 8) : 62,
      trend: pipelineSummary.opportunityCount > 0 ? 6 : 1,
      metrics: {
        leads: pipelineSummary.leadCount,
        opportunities: pipelineSummary.opportunityCount,
        pipelineValue: pipelineSummary.totalPipelineValue,
      },
    }),
    purchase: buildModuleScore({
      name: 'Purchase',
      score: vendorScore.vendors?.length ? 72 : 58,
      trend: vendorScore.vendors?.length ? 4 : 1,
      metrics: {
        vendors: vendorScore.vendors?.length || 0,
        onTimePct: vendorScore.vendors?.[0]?.onTimePct || 0,
        avgQtyAccuracy: vendorScore.vendors?.[0]?.avgQtyAccuracy || 0,
      },
    }),
    warehouse: buildModuleScore({
      name: 'Warehouse',
      score: warehouseSummary.totalShipments > 0 ? 80 : 65,
      trend: warehouseSummary.totalShipments > 0 ? 7 : 2,
      metrics: {
        readyToPick: warehouseSummary.readyToPick,
        packedCount: warehouseSummary.packedCount,
        shipmentsInTransit: warehouseSummary.shipmentsInTransit,
      },
      chartData: warehouseChartData,
      breakdown: [
        { name: 'Ready to pick', value: warehouseSummary.readyToPick, color: '#7c3aed' },
        { name: 'Packed', value: warehouseSummary.packedCount, color: '#0ea5e9' },
        { name: 'In transit', value: warehouseSummary.shipmentsInTransit, color: '#f59e0b' },
      ],
    }),
    finance: buildModuleScore({
      name: 'Finance',
      score: financeKpis.report?.health?.overallStatus === 'healthy' ? 88 : 72,
      trend: 5,
      metrics: {
        totalReceivable: agingReport.summary?.totalReceivable || 0,
        totalPayable: agingReport.summary?.totalPayable || 0,
        margin: financeKpis.margin?.marginPercent || 0,
      },
      chartData: financeChartData,
      breakdown: [
        { name: 'Receivables', value: agingReport.summary?.totalReceivable || 0, color: '#7c3aed' },
        { name: 'Payables', value: agingReport.summary?.totalPayable || 0, color: '#0ea5e9' },
        { name: 'Margin', value: financeKpis.margin?.marginPercent || 0, color: '#f59e0b' },
      ],
    }),
  };

  const summary = {
    totalRevenue: salesRevenue,
    totalOrders: salesOrdersCount,
    totalPipelineValue: pipelineSummary.totalPipelineValue,
    totalReceivable: agingReport.summary?.totalReceivable || 0,
    totalPayable: agingReport.summary?.totalPayable || 0,
    warehouseHealth: warehouseSummary.readyToPick,
    financeHealth: financeKpis.report?.health?.overallStatus || 'unknown',
  };

  const insights = [
    {
      title: 'Revenue pulse',
      detail: salesOrdersCount > 0 ? `${salesOrdersCount} active sales orders are contributing to tenant revenue.` : 'No active sales orders yet. Revenue insights will appear as transactions grow.',
      severity: salesRevenue >= 200000 ? 'positive' : 'watch',
    },
    {
      title: 'CRM momentum',
      detail: pipelineSummary.opportunityCount > 0 ? `${pipelineSummary.opportunityCount} opportunities are moving through the pipeline.` : 'Pipeline depth is still building for this tenant.',
      severity: 'neutral',
    },
    {
      title: 'Warehouse readiness',
      detail: warehouseSummary.readyToPick > 0 ? `${warehouseSummary.readyToPick} picks are ready to dispatch.` : 'Warehouse dispatch is currently idle.',
      severity: warehouseSummary.readyToPick > 0 ? 'positive' : 'watch',
    },
  ];

  return {
    tenantId,
    generatedAt: new Date().toISOString(),
    summary,
    modules,
    insights,
    financeReport: financeKpis,
    vendorScore,
    warehouseSummary,
    pipelineSummary,
    agingReport,
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const tenantId = req.headers['x-tenant-id'] || 'production';
    const payload = req.method === 'POST' ? (req.body || {}) : {};
    const snapshot = await buildTenantAnalyticsSnapshot({ tenantId, data: payload });
    return res.status(200).json({ success: true, tenantId, data: snapshot });
  } catch (err) {
    console.error('[analytics/engine] error', err?.message || err);
    return res.status(500).json({ success: false, error: err?.message || 'Internal' });
  }
}
