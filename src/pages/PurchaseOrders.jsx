import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import {
  getPurchaseOrders,
  getPurchaseOrder,
  createPurchaseOrder,
  approvePurchaseOrder,
  sendPurchaseOrderToSupplier,
  getSuppliers,
  getSupplierPerformanceReport,
  checkBudgetAvailability,
  validatePOBudget
} from '../lib/neonPurchaseAPI';
import ListFilterBar from '../components/ListFilterBar';
import PageHeader from '../components/PageHeader';
import PageCard from '../components/PageCard';
import DataTable from '../components/DataTable';
import StateBadge from '../components/StateBadge';
import BackendStatusBanner from '../components/BackendStatusBanner';
import { formatEtb } from '../lib/formatEtb';
import { buildPurchaseLifecycle } from '../lib/salesPurchaseDepth';
import { buildProcurementPosture } from '../lib/procurementDepth';
import useAnalyticsSnapshot from '../hooks/useAnalyticsSnapshot';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';

export default function PurchaseOrders() {
  const { t } = useLang();
  const { currentUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { snapshot } = useAnalyticsSnapshot();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ search: '', state: '', dateFrom: '', dateTo: '' });
  const [vendors, setVendors] = useState([]);
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [purchaseLifecycle, setPurchaseLifecycle] = useState(null);
  const [procurementPosture, setProcurementPosture] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    supplier_id: '',
    category_id: '',
    budget_id: '',
    payment_terms: 'net_30',
    delivery_terms: 'fob',
    expected_delivery_date: '',
    notes: '',
    items: []
  });
  const [budgetValidation, setBudgetValidation] = useState(null);
  const [supplierPerformance, setSupplierPerformance] = useState(null);

  const normalizeErrorMessage = (err) => {
    const raw = err?.error || err?.message || t('error');
    return raw;
  };

  useEffect(() => {
    let mounted = true;
    async function loadOrders(nextFilters) {
      setLoading(true);
      setError('');
      try {
        const result = await getPurchaseOrders({
          tenant_id: 'tenant_default',
          status: nextFilters.state || undefined,
          start_date: nextFilters.dateFrom || undefined,
          end_date: nextFilters.dateTo || undefined,
        });
        if (!mounted) return;
        setOrders(Array.isArray(result.data) ? result.data : []);
      } catch (err) {
        if (!mounted) return;
        setError(normalizeErrorMessage(err));
      } finally {
        if (mounted) setLoading(false);
      }
    }
    if (authLoading || !currentUser) return;
    loadOrders(filters);
    return () => { mounted = false; };
  }, [currentUser, authLoading, filters, t]);

  useEffect(() => {
    let mounted = true;
    async function loadVendors() {
      try {
        const res = await getSuppliers({ tenant_id: 'tenant_default', active: true });
        if (mounted) {
          setVendors(Array.isArray(res.data) ? res.data : []);
        }
      } catch { /* supplier load failures are non-fatal */ }
    }
    if (authLoading || !currentUser) return;
    loadVendors();
    return () => { mounted = false; };
  }, [currentUser, authLoading]);

  async function handleViewOrder(orderItem) {
    if (detailLoading) return;
    setDetailLoading(true);
    try {
      const result = await getPurchaseOrder(orderItem.id);
      const detail = result.data;
      setSelectedOrder(detail);
      setPurchaseLifecycle(buildPurchaseLifecycle(detail));
      setProcurementPosture(buildProcurementPosture(detail));
    } catch (err) {
      setError(normalizeErrorMessage(err));
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleConfirmOrder(orderId) {
    if (detailLoading) return;
    setDetailLoading(true);
    try {
      await approvePurchaseOrder(orderId, { approver_id: currentUser?.uid, approver_name: currentUser?.displayName || 'System' });
      const result = await getPurchaseOrder(orderId);
      setSelectedOrder(result.data);
      const ordersResult = await getPurchaseOrders({ tenant_id: 'tenant_default' });
      setOrders(Array.isArray(ordersResult.data) ? ordersResult.data : []);
    } catch (err) {
      setError(normalizeErrorMessage(err));
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleSendOrder(orderId) {
    if (detailLoading) return;
    setDetailLoading(true);
    try {
      await sendPurchaseOrderToSupplier(orderId, { sender_id: currentUser?.uid, sender_name: currentUser?.displayName || 'System' });
      const result = await getPurchaseOrder(orderId);
      setSelectedOrder(result.data);
      const ordersResult = await getPurchaseOrders({ tenant_id: 'tenant_default' });
      setOrders(Array.isArray(ordersResult.data) ? ordersResult.data : []);
    } catch (err) {
      setError(normalizeErrorMessage(err));
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleBudgetCheck() {
    if (!createFormData.budget_id || !createFormData.items.length) return;
    try {
      const totalAmount = createFormData.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
      const validation = await checkBudgetAvailability(createFormData.budget_id, totalAmount);
      setBudgetValidation(validation.data);
    } catch (err) {
      setError(normalizeErrorMessage(err));
    }
  }

  async function handleSupplierChange(supplierId) {
    setCreateFormData({ ...createFormData, supplier_id: supplierId });
    if (supplierId) {
      try {
        const perf = await getSupplierPerformanceReport('tenant_default');
        const supplierData = perf.data?.find(s => s.supplier_id === Number(supplierId));
        setSupplierPerformance(supplierData);
      } catch (err) {
        console.error('Failed to load supplier performance:', err);
      }
    } else {
      setSupplierPerformance(null);
    }
  }

  async function handleCreatePO(e) {
    e.preventDefault();
    setDetailLoading(true);
    try {
      const newPO = await createPurchaseOrder({
        tenant_id: 'tenant_default',
        ...createFormData,
        created_by: currentUser?.uid,
        created_by_name: currentUser?.displayName || 'System'
      });
      const result = await getPurchaseOrders({ tenant_id: 'tenant_default' });
      setOrders(Array.isArray(result.data) ? result.data : []);
      setShowCreateForm(false);
      setCreateFormData({
        supplier_id: '',
        category_id: '',
        budget_id: '',
        payment_terms: 'net_30',
        delivery_terms: 'fob',
        expected_delivery_date: '',
        notes: '',
        items: []
      });
      setBudgetValidation(null);
    } catch (err) {
      setError(normalizeErrorMessage(err));
    } finally {
      setDetailLoading(false);
    }
  }

  const filteredOrders = selectedVendorId
    ? orders.filter((o) => o.supplier_id === Number(selectedVendorId))
    : orders;

  const columns = [
    { key: 'po_number', header: t('order'), render: (r) => r.po_number || '—' },
    { key: 'supplier_name', header: t('partner'), render: (r) => r.supplier_name || '—' },
    { key: 'po_date', header: t('dateOrder'), render: (r) => r.po_date || '—' },
    { key: 'total_amount', header: t('amount'), className: 'erp-num', render: (r) => r.total_amount != null ? formatEtb(r.total_amount) : '—' },
    { key: 'status', header: t('state'), render: (r) => <StateBadge state={r.status} label={r.status || '—'} /> },
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
        title={t('purchaseOrders')}
        subtitle={t('purchaseOrdersDescription')}
        actions={
          <button onClick={() => setShowCreateForm(true)} className="btn-primary">
            + {t('createPurchaseOrder')}
          </button>
        }
      />

      {snapshot?.modules?.purchase && (
        <div className="mb-8 grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-1 flex flex-col gap-4">
            <div className="rounded-xl border border-white/20 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 p-6 backdrop-blur-xl shadow-lg dark:border-white/10 dark:from-emerald-900/30 dark:to-teal-900/20">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Vendor Reliability</h2>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-200/50 text-emerald-700 dark:bg-emerald-800/50 dark:text-emerald-200">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
              </div>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">
                {snapshot.modules.purchase.metrics?.onTimePct ?? 0}%
              </div>
              <div className="mt-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                On-time delivery average
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 flex-1">
              <div className="rounded-xl border border-white/20 bg-white/40 p-5 backdrop-blur-lg shadow-sm dark:border-slate-700/50 dark:bg-slate-800/40">
                <div className="text-sm text-slate-500 dark:text-slate-400">Active Vendors</div>
                <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">{snapshot.modules.purchase.metrics?.vendors ?? 0}</div>
              </div>
              <div className="rounded-xl border border-white/20 bg-white/40 p-5 backdrop-blur-lg shadow-sm dark:border-slate-700/50 dark:bg-slate-800/40">
                <div className="text-sm text-slate-500 dark:text-slate-400">Qty Accuracy</div>
                <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">{snapshot.modules.purchase.metrics?.avgQtyAccuracy ?? 0}%</div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 rounded-xl border border-white/20 bg-white/60 p-6 backdrop-blur-xl shadow-lg dark:border-slate-700/50 dark:bg-slate-800/60 flex flex-col">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Spend by Status</h2>
              <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                Module Health: {snapshot.modules.purchase.score}%
              </div>
            </div>
            <div className="flex-1 min-h-[200px] w-full flex items-center">
              {orders.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={Object.entries(
                        orders.reduce((acc, order) => {
                          acc[order.state] = (acc[order.state] || 0) + (order.amount_total || 0);
                          return acc;
                        }, {})
                      ).map(([state, value]) => ({ name: state, value }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {Object.keys(orders.reduce((acc, order) => { acc[order.state] = 1; return acc; }, {})).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#10b981', '#3b82f6', '#f59e0b', '#6366f1'][index % 4]} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value) => formatEtb(value)} />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full text-center text-slate-500 italic">Load orders to view spend distribution.</div>
              )}
            </div>
          </div>
        </div>
      )}

      <PageCard>
        <ListFilterBar
          model="purchase.order"
          value={filters}
          onChange={setFilters}
          onApply={() => setFilters((current) => ({ ...current }))}
          onClear={() => setFilters({ search: '', state: '', dateFrom: '', dateTo: '' })}
          fields={['search', 'state', 'dateRange']}
          stateOptions={[
            { value: 'draft', label: t('stateDraft') },
            { value: 'sent', label: t('stateSent') },
            { value: 'to approve', label: t('stateToApprove') },
            { value: 'purchase', label: t('statePurchase') },
            { value: 'done', label: t('stateDone') },
            { value: 'cancel', label: t('stateCancel') },
          ]}
          loading={loading}
        />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between my-3 gap-3">
          <div className="flex items-center space-x-2">
            <label htmlFor="vendorFilter" className="text-xs font-semibold text-gray-500">
              {t('vendor')}:
            </label>
            <select
              id="vendorFilter"
              value={selectedVendorId}
              onChange={(e) => setSelectedVendorId(e.target.value)}
              className="form-select text-xs py-1 px-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200"
            >
              <option value="">{t('selectVendor')}</option>
              {vendors.map((vendor) => (
                <option key={vendor.id} value={vendor.id}>
                  {vendor.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="my-4">
            <BackendStatusBanner message={error} onRetry={() => setFilters((current) => ({ ...current }))} />
          </div>
        )}

        <DataTable
          columns={columns}
          rows={filteredOrders}
          rowKey="id"
          loading={loading}
          emptyTitle={t('noPurchaseOrdersForTenant')}
          emptyIcon="🛒"
        />

        {!loading && !error && filteredOrders.length > 0 && (
          <div className="mt-4 flex justify-between items-center text-xs text-gray-400">
            <span>{t('loadedPurchaseOrders', { count: filteredOrders.length })}</span>
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
              {selectedOrder.po_number} - {t('purchaseOrderState') || 'Purchase Order Detail'}
            </h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <span className="text-xs text-gray-500 block">{t('vendor')}</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {selectedOrder.supplier_name || '—'}
                </span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">{t('dateOrder')}</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {selectedOrder.po_date || '—'}
                </span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">{t('state')}</span>
                <span className="text-sm block">
                  <StateBadge state={selectedOrder.status} label={selectedOrder.status} />
                </span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">{t('amount')}</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {formatEtb(selectedOrder.total_amount)}
                </span>
              </div>
            </div>

            {(purchaseLifecycle || procurementPosture) && (
              <div className="flex flex-wrap gap-2 mb-4">
                {purchaseLifecycle && (
                  <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
                    Lifecycle: {purchaseLifecycle.status}
                  </span>
                )}
                {procurementPosture && (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    Procurement stage: {procurementPosture.stage}
                  </span>
                )}
                {procurementPosture && (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    Approval pending: {procurementPosture.approvalPending ? 'Yes' : 'No'}
                  </span>
                )}
                {procurementPosture && (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    Receipt pending: {procurementPosture.receiptPending ? 'Yes' : 'No'}
                  </span>
                )}
              </div>
            )}

            <h3 className="text-md font-bold mb-2 text-gray-950 dark:text-white">
              {t('orderLines')}
            </h3>
            <div className="border border-gray-200 dark:border-gray-700 rounded overflow-hidden mb-6">
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
                  {(selectedOrder.items || []).map((line) => {
                    const qty = line.quantity || 0;
                    const price = line.unit_price || 0;
                    const subtotal = qty * price;
                    return (
                      <tr key={line.id} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0 text-gray-900 dark:text-gray-100">
                        <td className="p-3">{line.product_name || '—'}</td>
                        <td className="p-3 text-right">{qty}</td>
                        <td className="p-3 text-right">{formatEtb(price)}</td>
                        <td className="p-3 text-right font-semibold">{formatEtb(subtotal)}</td>
                      </tr>
                    );
                  })}
                  {(!selectedOrder.items || selectedOrder.items.length === 0) && (
                    <tr>
                      <td colSpan="4" className="p-3 text-center text-gray-500">
                        No lines found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center mt-6">
              <div className="flex space-x-2">
                {['draft', 'submitted'].includes(selectedOrder.status) && (
                  <>
                    <button
                      onClick={() => handleConfirmOrder(selectedOrder.id)}
                      disabled={detailLoading}
                      className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded text-sm font-semibold disabled:opacity-50"
                    >
                      {t('confirm') || 'Approve Order'}
                    </button>
                    <button
                      onClick={() => handleSendOrder(selectedOrder.id)}
                      disabled={detailLoading}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-sm font-semibold disabled:opacity-50"
                    >
                      {t('send') || 'Send to Supplier'}
                    </button>
                  </>
                )}
              </div>
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

      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-6">
            <button onClick={() => setShowCreateForm(false)} className="absolute top-4 right-4 text-gray-500">✕</button>
            <h2 className="text-xl font-bold mb-4">Create Purchase Order</h2>
            <form onSubmit={handleCreatePO} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Supplier</label>
                <select value={createFormData.supplier_id} onChange={(e) => handleSupplierChange(e.target.value)} className="w-full border rounded px-3 py-2" required>
                  <option value="">Select Supplier</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} {v.rating ? `(Rating: ${v.rating})` : ''}
                    </option>
                  ))}
                </select>
                {supplierPerformance && (
                  <div className="mt-2 text-sm bg-gray-100 dark:bg-gray-700 p-2 rounded">
                    <div className="font-semibold">Supplier Performance:</div>
                    <div>On-Time Delivery: {supplierPerformance.on_time_delivery_pct || 0}%</div>
                    <div>Quality Rating: {supplierPerformance.quality_rating || 'N/A'}</div>
                    <div>Total Orders: {supplierPerformance.total_orders || 0}</div>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Budget ID</label>
                <div className="flex gap-2">
                  <input type="text" value={createFormData.budget_id} onChange={(e) => setCreateFormData({ ...createFormData, budget_id: e.target.value })} className="flex-1 border rounded px-3 py-2" required />
                  <button type="button" onClick={handleBudgetCheck} className="px-3 py-2 bg-blue-600 text-white rounded text-sm">Check Budget</button>
                </div>
                {budgetValidation && (
                  <div className={`mt-2 text-sm ${budgetValidation.available ? 'text-green-600' : 'text-red-600'}`}>
                    {budgetValidation.available 
                      ? `Budget Available: ${formatEtb(budgetValidation.available_amount)}`
                      : `Insufficient Budget. Required: ${formatEtb(budgetValidation.required_amount)}, Available: ${formatEtb(budgetValidation.available_amount)}`
                    }
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Expected Delivery</label>
                <input type="date" value={createFormData.expected_delivery_date} onChange={(e) => setCreateFormData({ ...createFormData, expected_delivery_date: e.target.value })} className="w-full border rounded px-3 py-2" required />
              </div>
              <button type="submit" disabled={detailLoading} className="w-full bg-violet-600 text-white py-2 rounded">Create PO</button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
