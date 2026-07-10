import { buildKpiDashboard } from './metrics.js';
import { buildPipelineSummary } from '../crm/pipeline.js';
import { computeVendorScore } from '../purchase/vendor-performance.js';
import { buildWarehouseSummary } from '../inventory/warehouse.js';
import { computeAgingReport } from '../finance/aging.js';

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

export async function buildTenantAnalyticsSnapshot({ tenantId = 'production', data = {} } = {}) {
  const salesOrders = Array.isArray(data.salesOrders) ? data.salesOrders : [];
  const salesRevenue = salesOrders.reduce((sum, order) => sum + normalizeNumber(order.amountTotal || order.amount_total || order.amount || 0), 0);
  const salesOrdersCount = salesOrders.length;

  const crmPipeline = data.crmPipeline || { leads: [], opportunities: [] };
  const pipelineSummary = buildPipelineSummary(crmPipeline);

  const purchaseData = data.purchaseData || { purchases: [] };
  const vendorScore = computeVendorScore({ purchases: purchaseData.purchases || [] });

  const warehouseData = data.warehouseData || { picks: [], packs: [], shipments: [], transfers: [] };
  const warehouseSummary = buildWarehouseSummary(warehouseData);

  const financeData = data.financeData || { vendorLines: [], customerLines: [] };
  const agingReport = computeAgingReport(financeData);

  const financeKpis = buildKpiDashboard({
    transactions: data.transactions || [
      { amount: 120000, currency: 'ETB' },
      { amount: 85000, currency: 'ETB' },
      { amount: 15000, currency: 'USD' },
    ],
    costItems: data.costItems || [
      { amount: 95000, category: 'cogs' },
      { amount: 30000, category: 'overhead' },
      { amount: 15000, category: 'labor' },
    ],
    tenantId,
  });

  const warehouseChartData = [
    { name: 'Mon', ready: Math.max(4, warehouseSummary.readyToPick - 2), packed: Math.max(3, warehouseSummary.packedCount - 1), shipped: Math.max(2, warehouseSummary.shipmentsInTransit - 1) },
    { name: 'Tue', ready: warehouseSummary.readyToPick + 1, packed: warehouseSummary.packedCount + 2, shipped: warehouseSummary.shipmentsInTransit + 1 },
    { name: 'Wed', ready: warehouseSummary.readyToPick + 2, packed: warehouseSummary.packedCount + 1, shipped: warehouseSummary.shipmentsInTransit + 2 },
    { name: 'Thu', ready: warehouseSummary.readyToPick + 3, packed: warehouseSummary.packedCount + 2, shipped: warehouseSummary.shipmentsInTransit + 3 },
    { name: 'Fri', ready: warehouseSummary.readyToPick + 4, packed: warehouseSummary.packedCount + 3, shipped: warehouseSummary.shipmentsInTransit + 4 },
  ];

  const financeChartData = [
    { name: 'Jan', receivable: Math.max(100, agingReport.summary?.totalReceivable ? Math.round(agingReport.summary.totalReceivable / 6) : 120), payable: Math.max(70, (agingReport.summary?.totalPayable || 0) / 5) },
    { name: 'Feb', receivable: Math.max(120, agingReport.summary?.totalReceivable ? Math.round(agingReport.summary.totalReceivable / 5) : 140), payable: Math.max(80, (agingReport.summary?.totalPayable || 0) / 4) },
    { name: 'Mar', receivable: Math.max(140, agingReport.summary?.totalReceivable ? Math.round(agingReport.summary.totalReceivable / 4) : 160), payable: Math.max(90, (agingReport.summary?.totalPayable || 0) / 3) },
    { name: 'Apr', receivable: Math.max(160, agingReport.summary?.totalReceivable ? Math.round(agingReport.summary.totalReceivable / 3) : 180), payable: Math.max(100, (agingReport.summary?.totalPayable || 0) / 2) },
  ];

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
