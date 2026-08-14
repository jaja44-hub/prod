import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
// Removed ServiceGateway import
import { createSalesRequisition } from '../lib/neonSalesAPI';
import ListFilterBar from '../components/ListFilterBar';
import PageHeader from '../components/PageHeader';
import PageCard from '../components/PageCard';
import DataTable from '../components/DataTable';
import StateBadge from '../components/StateBadge';
import BackendStatusBanner from '../components/BackendStatusBanner';
import { formatEtb } from '../lib/formatEtb';
import { buildSalesLifecycle } from '../lib/salesPurchaseDepth';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function Sales() {
  const { t } = useLang();
  const { currentUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ search: '', state: '', dateFrom: '', dateTo: '' });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [salesLifecycle, setSalesLifecycle] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);

  const normalizeErrorMessage = (err) => {
    const raw = err?.error?.message || err?.error || err?.message || err || t('error');
    return typeof raw === 'string' ? raw : JSON.stringify(raw);
  };

  const handleCreateRequisition = async (requisitionData) => {
    setRequestLoading(true);
    try {
      await createSalesRequisition({
        ...requisitionData,
        module: 'sales',
        requested_by: currentUser?.id || 'user',
        requested_by_name: currentUser?.name || currentUser?.email || 'User'
      });
      setShowRequestModal(false);
    } catch (err) {
      setError(normalizeErrorMessage(err));
    } finally {
      setRequestLoading(false);
    }
  };

  // ── Live sales KPIs derived from the orders list (no hardcoded fallback) ──
  const liveSales = useMemo(() => {
    const rows = Array.isArray(orders) ? orders : [];
    const totalRevenue = rows.reduce((sum, o) => sum + (Number(o.total_amount ?? o.amount_total) || 0), 0);
    const orderCount = rows.length;
    const averageValue = orderCount > 0 ? totalRevenue / orderCount : 0;

    // Revenue trend bucketed by month from live order dates.
    const byMonth = new Map();
    for (const o of rows) {
      const d = new Date(o.order_date || o.date_order);
      if (Number.isNaN(d.getTime())) continue;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      byMonth.set(key, (byMonth.get(key) || 0) + (Number(o.total_amount ?? o.amount_total) || 0));
    }
    const trend = [...byMonth.entries()]
      .sort((a, b) => (a[0] < b[0] ? -1 : 1))
      .map(([key, value]) => ({ name: key.slice(2), value: Math.round(value) }));

    return { totalRevenue, orderCount, averageValue, trend };
  }, [orders]);

  useEffect(() => {
    let mounted = true;
    async function loadSales(nextFilters) {
      setLoading(true);
      setError('');
      try {
        const { getApiClient } = await import('../lib/apiClient.js');
        const client = getApiClient();
        
        const params = new URLSearchParams();
        params.append('tenant_id', 'tenant_default');
        if (nextFilters.search) params.append('search', nextFilters.search);
        if (nextFilters.state) params.append('state', nextFilters.state);
        
        const result = await client.sales(`orders?${params.toString()}`).catch(() => null);
        if (!mounted) return;
        setOrders(result?.data && Array.isArray(result.data) ? result.data : []);
      } catch (err) {
        if (!mounted) return;
        setError(normalizeErrorMessage(err));
      } finally {
        if (mounted) setLoading(false);
      }
    }
    if (authLoading || !currentUser) return;
    loadSales(filters);
    return () => { mounted = false; };
  }, [currentUser, authLoading, filters, t]);

  async function handleViewOrder(orderItem) {
    if (detailLoading) return;
    setDetailLoading(true);
    try {
      const { getApiClient } = await import('../lib/apiClient.js');
      const client = getApiClient();
      // Neon API doesn't have sales order detail yet, but fallback gracefully
      const detail = await client.sales(`orders/${orderItem.id}?tenant_id=tenant_default`).catch(() => null);
      if (detail && detail.data) {
        setSelectedOrder(detail.data);
        setSalesLifecycle(buildSalesLifecycle(detail.data));
      } else {
        // Fallback for missing endpoint
        setSelectedOrder(orderItem);
        setSalesLifecycle(buildSalesLifecycle(orderItem));
      }
    } catch (err) {
      setError(normalizeErrorMessage(err));
    } finally {
      setDetailLoading(false);
    }
  }

  const columns = [
    { key: 'order', header: t('order'), render: (r) => r.order_number || r.name || '—' },
    { key: 'partner', header: t('partner'), render: (r) => r.customer_name || r.partner_id?.[1] || '—' },
    { key: 'amount', header: t('amount'), className: 'erp-num', render: (r) => {
      const v = Number(r.total_amount ?? r.amount_total);
      return v != null && !Number.isNaN(v) ? formatEtb(v) : '—';
    } },
    { key: 'state', header: t('state'), render: (r) => {
      const state = r.status || r.state;
      return <StateBadge state={state} label={state ? t(`state${state.charAt(0).toUpperCase() + state.slice(1)}`) || state : '—'} />;
    } },
    { key: 'date', header: t('dateOrder'), render: (r) => r.order_date || r.date_order || '—' },
    { key: 'actions', header: '', render: (r) => (
      <button
        onClick={() => handleViewOrder(r)}
        disabled={detailLoading}
        className="text-xs text-violet-600 dark:text-violet-400 font-semibold hover:underline disabled:opacity-50"
      >
        {detailLoading ? t('loading') : t('viewOrder')}
      </button>
    )},
  ];

  return (
    <section>
      <PageHeader
        title={t('sales')}
        subtitle={t('salesOrdersDescription')}
        actions={
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowRequestModal(true)} 
              className="btn-secondary"
              disabled={requestLoading}
            >
              ��� {t('requestDispatch') || 'Request Dispatch'}
            </button>
            <button onClick={() => navigate('/sales/new')} className="btn-primary">
              + {t('createSalesOrder')}
            </button>
          </div>
        }
      />

      {orders.length > 0 && (
        <div className="mb-8 grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-1 flex flex-col gap-4">
            <div className="rounded-xl border border-white/20 bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 p-6 backdrop-blur-xl shadow-lg dark:border-white/10 dark:from-violet-900/30 dark:to-fuchsia-900/20">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-violet-700 dark:text-violet-300">Total Revenue</h2>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-200/50 text-violet-700 dark:bg-violet-800/50 dark:text-violet-200">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
              </div>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">
                {formatEtb(liveSales.totalRevenue)}
              </div>
              <div className="mt-2 text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                {t('liveFromLedger') || 'Live from sales orders'}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 flex-1">
              <div className="rounded-xl border border-white/20 bg-white/40 p-5 backdrop-blur-lg shadow-sm dark:border-slate-700/50 dark:bg-slate-800/40">
                <div className="text-sm text-slate-500 dark:text-slate-400">Total Orders</div>
                <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">{liveSales.orderCount}</div>
              </div>
              <div className="rounded-xl border border-white/20 bg-white/40 p-5 backdrop-blur-lg shadow-sm dark:border-slate-700/50 dark:bg-slate-800/40">
                <div className="text-sm text-slate-500 dark:text-slate-400">Avg Value</div>
                <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">{formatEtb(liveSales.averageValue).replace(' ETB', '')}</div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 rounded-xl border border-white/20 bg-white/60 p-6 backdrop-blur-xl shadow-lg dark:border-slate-700/50 dark:bg-slate-800/60 flex flex-col">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Revenue Trend</h2>
              <div className="rounded-full bg-violet-100 px-3 py-1 text-xs font-medium text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                Live ({liveSales.orderCount} orders)
              </div>
            </div>
            <div className="flex-1 min-h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={liveSales.trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" strokeOpacity={0.2} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(val) => `${val / 1000}k`} />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: 'rgba(255,255,255,0.9)' }}
                    formatter={(value) => [formatEtb(value), 'Revenue']}
                  />
                  <Area type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      <PageCard>
        <ListFilterBar
          model="sale.order"
          value={filters}
          onChange={setFilters}
          onApply={() => setFilters((current) => ({ ...current }))}
          onClear={() => setFilters({ search: '', state: '', dateFrom: '', dateTo: '' })}
          fields={['search', 'state', 'dateRange']}
          stateOptions={[
            { value: 'draft', label: t('stateDraft') },
            { value: 'sent', label: t('stateSent') },
            { value: 'sale', label: t('stateSale') },
            { value: 'done', label: t('stateDone') },
            { value: 'cancel', label: t('stateCancel') },
          ]}
          loading={loading}
        />

        {error && (
          <div className="my-4">
            <BackendStatusBanner message={error} onRetry={() => setFilters((current) => ({ ...current }))} />
          </div>
        )}

        <DataTable
          columns={columns}
          rows={orders}
          rowKey="id"
          loading={loading}
          emptyTitle={t('noSalesOrdersForTenant')}
          emptyIcon="📈"
        />

        {!loading && !error && orders.length > 0 && (
          <div className="mt-4 flex justify-between items-center text-xs text-gray-400">
            <span>{t('loadedOrders', { count: orders.length })}</span>
            <span>{t('endOfResults')}</span>
          </div>
        )}
      </PageCard>

      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-6 relative">
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-lg font-bold"
            >
              ✕
            </button>
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
              {selectedOrder.order_number || selectedOrder.name} - {t('salesOrderState') || 'Order Detail'}
            </h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <span className="text-xs text-gray-500 block">{t('customer')}</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {selectedOrder.customer_name || selectedOrder.partner_id?.[1] || '—'}
                </span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">{t('dateOrder')}</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {selectedOrder.order_date || selectedOrder.date_order || '—'}
                </span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">{t('state')}</span>
                <span className="text-sm block">
                  <StateBadge state={selectedOrder.status || selectedOrder.state} label={selectedOrder.status || selectedOrder.state || '—'} />
                </span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">{t('amount')}</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {formatEtb(Number(selectedOrder.total_amount ?? selectedOrder.amount_total) || 0)}
                </span>
              </div>
            </div>

            {salesLifecycle && (
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
                  Lifecycle: {salesLifecycle.status}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  Follow-up needed: {salesLifecycle.followUpNeeded ? 'Yes' : 'No'}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  Revenue ready: {salesLifecycle.revenueReady ? 'Yes' : 'No'}
                </span>
              </div>
            )}

            <h3 className="text-md font-bold mb-2 text-gray-950 dark:text-white">
              {t('orderLines')}
            </h3>
            <div className="border border-gray-200 dark:border-gray-700 rounded overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr className="text-left text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                    <th className="p-3">{t('product')}</th>
                    <th className="p-3 text-right">{t('quantity')}</th>
                    <th className="p-3 text-right">{t('unitPrice')}</th>
                    <th className="p-3 text-right">{t('value')}</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedOrder.order_lines || []).map((line) => {
                    const qty = line.product_uom_qty || 0;
                    const price = line.price_unit || 0;
                    const subtotal = qty * price;
                    return (
                      <tr key={line.id} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0 text-gray-900 dark:text-gray-100">
                        <td className="p-3">{line.product_id?.[1] || '—'}</td>
                        <td className="p-3 text-right">{qty}</td>
                        <td className="p-3 text-right">{formatEtb(price)}</td>
                        <td className="p-3 text-right font-semibold">{formatEtb(subtotal)}</td>
                      </tr>
                    );
                  })}
                  {(!selectedOrder.order_lines || selectedOrder.order_lines.length === 0) && (
                    <tr>
                      <td colSpan="4" className="p-3 text-center text-gray-500">
                        No lines found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded text-sm font-semibold"
              >
                {t('clear') || 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">{t('requestDispatch') || 'Request Dispatch'}</h2>
              <button onClick={() => setShowRequestModal(false)} className="text-gray-500 hover:text-gray-700">���</button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleCreateRequisition({ items: [{ product_name: e.target.elements.product_name.value, quantity: Number(e.target.elements.quantity.value), unit_of_measure: e.target.elements.unit.value || 'EA', unit_price: Number(e.target.elements.unit_price.value) || 0 }], expected_delivery_date: e.target.elements.expected_date.value || null, priority: e.target.elements.priority.value, notes: e.target.elements.notes.value }); }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('productName') || 'Product Name'}</label>
                  <input name="product_name" type="text" required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('quantity') || 'Quantity'}</label>
                  <input name="quantity" type="number" required min="1" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('unitOfMeasure') || 'Unit of Measure'}</label>
                  <input name="unit" type="text" defaultValue="EA" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('unitPrice') || 'Unit Price'}</label>
                  <input name="unit_price" type="number" step="0.01" min="0" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('expectedDeliveryDate') || 'Expected Delivery Date'}</label>
                  <input name="expected_date" type="date" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('priority') || 'Priority'}</label>
                  <select name="priority" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
                    <option value="low">{t('low') || 'Low'}</option>
                    <option value="normal" selected>{t('normal') || 'Normal'}</option>
                    <option value="high">{t('high') || 'High'}</option>
                    <option value="urgent">{t('urgent') || 'Urgent'}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('notes') || 'Notes'}</label>
                  <textarea name="notes" rows="3" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500"></textarea>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setShowRequestModal(false)} className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600">
                  {t('cancel') || 'Cancel'}
                </button>
                <button type="submit" disabled={requestLoading} className="px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700 disabled:opacity-50">
                  {requestLoading ? (t('submitting') || 'Submitting...') : (t('submit') || 'Submit')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
