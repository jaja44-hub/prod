/**
 * src/pages/WarehouseDashboard.jsx
 * Warehouse dashboard component integrating pick/pack/ship workflow APIs.
 */

import { useEffect, useMemo, useState } from 'react';
import { getApiClient } from '../lib/apiClient.js';
import PageHeader from '../components/PageHeader';
import PageCard from '../components/PageCard';
import useAnalyticsSnapshot from '../hooks/useAnalyticsSnapshot';
import { MetricTile, ProgressRing, TrendChart, BreakdownList, InsightPills, currency } from '../components/analytics/AnalyticsCharts';
import { buildDemoWarehouseWorkflow, buildDemoCycleCounts } from '../lib/demoAnalyticsData';

function MetricCard({ label, value, tone = 'slate' }) {
  const toneClasses = {
    slate: 'text-slate-700 dark:text-slate-200',
    blue: 'text-blue-700 dark:text-blue-300',
    green: 'text-emerald-700 dark:text-emerald-300',
    amber: 'text-amber-700 dark:text-amber-300',
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm dark:border-slate-700 dark:from-slate-800 dark:to-slate-900">
      <div className="text-sm text-slate-500 dark:text-slate-400">{label}</div>
      <div className={`mt-2 text-2xl font-semibold ${toneClasses[tone] || toneClasses.slate}`}>{value}</div>
    </div>
  );
}

export function WarehouseDashboard() {
  const [workflowData, setWorkflowData] = useState(() => buildDemoWarehouseWorkflow());
  const [cycleCounts, setCycleCounts] = useState(() => buildDemoCycleCounts());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { snapshot } = useAnalyticsSnapshot();

  const countSummary = useMemo(() => {
    return cycleCounts.reduce((summary, item) => {
      const status = item.state || 'unknown';
      summary[status] = (summary[status] || 0) + 1;
      return summary;
    }, {});
  }, [cycleCounts]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const client = getApiClient();

        const [workflow, counts] = await Promise.all([
          client.warehouse('workflow').catch(() => buildDemoWarehouseWorkflow()),
          client.inventory('cycleCounts').catch(() => buildDemoCycleCounts()),
        ]);

        const nextWorkflow = workflow?.data || workflow || buildDemoWarehouseWorkflow();
        setWorkflowData(nextWorkflow);
        const nextCounts = Array.isArray(counts?.data) ? counts.data : Array.isArray(counts) ? counts : buildDemoCycleCounts();
        setCycleCounts(nextCounts);
      } catch (err) {
        setError(err.message || 'Failed to load warehouse data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const workflowReport = workflowData?.report || workflowData?.workflow?.report || null;
  const shipments = Array.isArray(workflowReport?.shipments) ? workflowReport.shipments : [];
  const movements = Array.isArray(workflowReport?.movements) ? workflowReport.movements : [];
  const workflowStages = Array.isArray(workflowReport?.workflow) ? workflowReport.workflow : [];

  if (loading) return <div className="space-y-4"><PageHeader title="Warehouse Operations" subtitle="Aggregating dispatch, inventory, and cycle count signals" /><div className="animate-pulse space-y-3"><div className="h-20 rounded-xl bg-slate-200 dark:bg-slate-800" /><div className="h-32 rounded-xl bg-slate-200 dark:bg-slate-800" /></div></div>;
  if (error) return <div className="space-y-4"><PageHeader title="Warehouse Operations" subtitle="The live warehouse feed is temporarily unavailable" /><PageCard className="border-amber-300 bg-amber-50/80 dark:border-amber-700 dark:bg-amber-900/20"><p className="text-sm text-amber-800 dark:text-amber-300">{error}</p></PageCard></div>;

  return (
    <section className="space-y-6">
      <PageHeader title="Warehouse Operations" subtitle="Monitor pick, pack, ship progress and physical inventory health in one place." />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total Orders" value={workflowReport?.summary?.totalOrders || workflowData?.summary?.totalPicks || 0} tone="blue" />
        <MetricCard label="Picking" value={workflowReport?.summary?.pickingCount || workflowData?.summary?.readyToPick || 0} tone="amber" />
        <MetricCard label="Packing" value={workflowReport?.summary?.packingCount || workflowData?.summary?.totalPacks || 0} tone="slate" />
        <MetricCard label="Shipped" value={workflowReport?.summary?.shippedCount || workflowData?.summary?.totalShipments || 0} tone="green" />
      </div>

      {snapshot?.modules?.warehouse && (
        <PageCard>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="inline-flex items-center rounded-full bg-violet-100 px-3 py-1 text-sm font-medium text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">Warehouse analytics</div>
              <h2 className="mt-3 text-xl font-semibold text-slate-900 dark:text-slate-100">Dispatch readiness and fulfillment performance</h2>
              <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">A polished operational overview for pick, pack, ship throughput with reusable trend and distribution views.</p>
            </div>
            <ProgressRing value={snapshot.modules.warehouse.score} label="Warehouse health" sublabel="Reflects current readiness, packing pace, and shipment momentum." />
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <MetricTile label="Ready to pick" value={snapshot.modules.warehouse.metrics?.readyToPick ?? 0} detail="live" tone="violet" />
                <MetricTile label="Packed" value={snapshot.modules.warehouse.metrics?.packedCount ?? 0} detail="today" tone="blue" />
                <MetricTile label="In transit" value={snapshot.modules.warehouse.metrics?.shipmentsInTransit ?? 0} detail="moving" tone="emerald" />
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800/80">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Fulfillment trend</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">A weekly view of fulfillment activity across the warehouse.</p>
                  </div>
                </div>
                <TrendChart data={snapshot.modules.warehouse.chartData} dataKeys={['ready', 'packed', 'shipped']} />
              </div>
            </div>
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800/80">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Distribution by stage</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Current queue split between pick, pack, and dispatch.</p>
                <div className="mt-4">
                  <BreakdownList data={snapshot.modules.warehouse.breakdown?.map((item) => ({ ...item, valueLabel: `${item.value}` })) || []} />
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-violet-600 to-indigo-600 p-4 text-white shadow-sm">
                <div className="text-sm font-medium text-violet-100">Executive insight</div>
                <div className="mt-2 text-lg font-semibold">{snapshot.insights?.find((item) => item.title === 'Warehouse readiness')?.detail}</div>
                <div className="mt-4"><InsightPills items={[{ title: 'Dispatch improving', direction: 'up' }, { title: 'Capacity stable', direction: 'up' }]} /></div>
              </div>
            </div>
          </div>
        </PageCard>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <PageCard>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Pick / Pack / Ship flow</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">A live view of order movement by stage.</p>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {workflowStages.length > 0 ? workflowStages.map((item) => (
              <div key={item.id || item.orderId} className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/70">
                <p className="text-xs uppercase tracking-wide text-slate-500">{item.status}</p>
                <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">Order {item.orderId || '—'}</p>
                <p className="text-sm text-slate-600 dark:text-slate-300">SKU {item.sku || '—'} · Qty {item.quantity || 0}</p>
              </div>
            )) : <div className="md:col-span-3 rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">No dispatch stages reported yet.</div>}
          </div>
        </PageCard>

        <PageCard>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Cycle count health</h2>
          <div className="mt-4 space-y-2">
            {Object.entries(countSummary).length > 0 ? Object.entries(countSummary).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800/70">
                <span className="capitalize text-slate-600 dark:text-slate-300">{status}</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{count}</span>
              </div>
            )) : <div className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">Cycle count data will appear here once inventory checks are recorded.</div>}
          </div>
        </PageCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <PageCard>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Recent shipments</h2>
          <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
            <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-800/80">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-slate-600 dark:text-slate-300">Shipment</th>
                  <th className="px-3 py-2 text-left font-medium text-slate-600 dark:text-slate-300">Carrier</th>
                  <th className="px-3 py-2 text-left font-medium text-slate-600 dark:text-slate-300">Tracking</th>
                  <th className="px-3 py-2 text-left font-medium text-slate-600 dark:text-slate-300">Status</th>
                </tr>
              </thead>
              <tbody>
                {shipments.length > 0 ? shipments.slice(0, 10).map((shipment) => (
                  <tr key={shipment.id || shipment.shipmentId} className="border-t border-slate-200 dark:border-slate-700">
                    <td className="px-3 py-2 text-slate-700 dark:text-slate-200">{shipment.shipmentId || shipment.id || '—'}</td>
                    <td className="px-3 py-2 text-slate-700 dark:text-slate-200">{shipment.carrier || '—'}</td>
                    <td className="px-3 py-2 text-slate-700 dark:text-slate-200">{shipment.trackingNumber || '—'}</td>
                    <td className="px-3 py-2 text-slate-700 dark:text-slate-200">{shipment.status || '—'}</td>
                  </tr>
                )) : <tr><td colSpan="4" className="px-3 py-4 text-sm text-slate-500 dark:text-slate-400">No shipment activity found.</td></tr>}
              </tbody>
            </table>
          </div>
        </PageCard>

        <PageCard>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Inventory movements</h2>
          <div className="mt-4 space-y-3">
            {movements.length > 0 ? movements.slice(0, 8).map((movement, idx) => (
              <div key={`${movement.timestamp || idx}-${movement.location || idx}`} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800/70">
                <div>
                  <div className="font-medium text-slate-900 dark:text-slate-100">{movement.type || 'movement'}</div>
                  <div className="text-slate-500 dark:text-slate-400">{movement.location || '—'}</div>
                </div>
                <div className="text-right text-slate-600 dark:text-slate-300">
                  <div>{movement.quantity || 0} units</div>
                  <div className="text-xs text-slate-400">{movement.timestamp || '—'}</div>
                </div>
              </div>
            )) : <div className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">No movement history yet.</div>}
          </div>
        </PageCard>
      </div>
    </section>
  );
}

export default WarehouseDashboard;
