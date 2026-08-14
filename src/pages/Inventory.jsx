import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import { getWarehouseWorkflow, getInventoryProducts, getInventoryLocations, createInventoryRequisition } from '../lib/neonWarehouseAPI';
import ListFilterBar from '../components/ListFilterBar';
import PageHeader from '../components/PageHeader';
import PageCard from '../components/PageCard';
import DataTable from '../components/DataTable';
import BackendStatusBanner from '../components/BackendStatusBanner';
import { formatEtb } from '../lib/formatEtb';
import { buildInventoryInsights } from '../lib/inventoryDepth';
import useAnalyticsSnapshot from '../hooks/useAnalyticsSnapshot';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';

export default function Inventory() {
  const { t } = useLang();
  const { currentUser, loading: authLoading } = useAuth();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ search: '', active: true, categoryId: undefined, locationId: undefined });
  const [endReached, setEndReached] = useState(true);
  const [showValue, setShowValue] = useState(false);
  const [inventorySummary, setInventorySummary] = useState(null);
  const [warehouseWorkflow, setWarehouseWorkflow] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);
  const { snapshot } = useAnalyticsSnapshot();

  const normalizeErrorMessage = (err) => {
    const raw = err?.error || err?.message || t('error');
    return raw;
  };

  const handleCreateRequisition = async (requisitionData) => {
    setRequestLoading(true);
    try {
      await createInventoryRequisition({
        ...requisitionData,
        module: 'inventory',
        requested_by: currentUser?.id || 'user',
        requested_by_name: currentUser?.name || currentUser?.email || 'User'
      });
      setShowRequestModal(false);
      // Optionally refresh the list or show success message
    } catch (err) {
      setError(normalizeErrorMessage(err));
    } finally {
      setRequestLoading(false);
    }
  };

  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    async function loadProducts(initialFilters) {
      setLoading(true);
      setError('');
      try {
        const filters = {
          tenant_id: 'tenant_default',
          search: initialFilters.search || undefined,
          location_id: initialFilters.locationId || undefined,
        };
        const result = await getInventoryProducts(filters);
        const products = result.data || result;
        if (!mounted) return;
        const list = Array.isArray(products) ? products : [];
        setItems(list);
        setEndReached(list.length < 50);
        const summary = list.length > 0 ? buildInventoryInsights(list[0], { quantity: list[0].quantity_available || 0, reserved_quantity: 0 }) : null;
        setInventorySummary(summary);
      } catch (err) {
        if (!mounted) return;
        setError(normalizeErrorMessage(err));
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    }
    if (authLoading || !currentUser) return;
    loadProducts(filters);
    return () => { mounted = false; };
  }, [authLoading, currentUser, filters, showValue]);

  useEffect(() => {
    let mounted = true;
    async function loadOptions() {
      try {
        const locationResult = await getInventoryLocations({ tenant_id: 'tenant_default' });
        if (!mounted) return;
        const locations = locationResult.data || locationResult;
        setLocations(Array.isArray(locations) ? locations : []);
        // For categories, we'll use a static list for now or add backend API later
        setCategories([]);
      } catch { /* option load failures are non-fatal */ }
    }
    if (authLoading || !currentUser) return;
    loadOptions();
    return () => { mounted = false; };
  }, [authLoading, currentUser]);

  useEffect(() => {
    let mounted = true;
    async function loadWarehouseWorkflow() {
      try {
        const workflowResult = await getWarehouseWorkflow('tenant_default');
        if (!mounted) return;
        setWarehouseWorkflow(workflowResult.data || workflowResult);
      } catch (err) {
        console.error('Failed to load warehouse workflow:', err);
      }
    }
    if (authLoading || !currentUser) return;
    loadWarehouseWorkflow();
    return () => { mounted = false; };
  }, [authLoading, currentUser]);

  const columns = [
    { key: 'sku', header: t('sku'), render: (r) => r.sku || r.product_code || '—' },
    { key: 'name', header: t('name'), render: (r) => r.name || r.product_name || '—' },
    { key: 'category', header: t('category'), render: (r) => r.category_name || '—' },
    { key: 'quantity_available', header: t('quantity'), className: 'erp-num', render: (r) => typeof r.quantity_available === 'number' ? r.quantity_available : '—' },
    { key: 'unit', header: t('unit'), render: (r) => r.unit_of_measure || t('unit') },
    ...(showValue ? [{ key: 'total_value', header: t('value'), className: 'erp-num', render: (r) => typeof r.total_value === 'number' ? formatEtb(r.total_value) : '—' }] : []),
    { key: 'actions', header: '', render: (r) => (
      <button onClick={() => r.id && navigate(`/inventory/${r.id}`)} className="text-xs text-violet-600 dark:text-violet-400 hover:underline">
        {t('viewEdit')}
      </button>
    )},
  ];

  return (
    <section>
      <PageHeader
        title={t('inventory')}
        subtitle={t('inventoryDescription')}
        actions={
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowRequestModal(true)} 
              className="btn-secondary"
              disabled={requestLoading}
            >
              ��� {t('requestInventory') || 'Request Inventory'}
            </button>
            <button onClick={() => navigate('/inventory/new')} className="btn-primary">
              + {t('addItem')}
            </button>
          </div>
        }
      />

      {snapshot?.modules?.warehouse && (
        <div className="mb-8 grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-1 flex flex-col gap-4">
            <div className="rounded-xl border border-white/20 bg-gradient-to-br from-amber-500/10 to-orange-500/10 p-6 backdrop-blur-xl shadow-lg dark:border-white/10 dark:from-amber-900/30 dark:to-orange-900/20">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">Fulfillment Pipeline</h2>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-200/50 text-amber-700 dark:bg-amber-800/50 dark:text-amber-200">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </span>
              </div>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">
                {warehouseWorkflow?.summary?.shipmentsInTransit ?? snapshot.modules.warehouse.metrics?.shipmentsInTransit ?? 0}
              </div>
              <div className="mt-2 text-xs font-medium text-amber-600 dark:text-amber-400">
                Active shipments in transit
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 flex-1">
              <div className="rounded-xl border border-white/20 bg-white/40 p-5 backdrop-blur-lg shadow-sm dark:border-slate-700/50 dark:bg-slate-800/40">
                <div className="text-sm text-slate-500 dark:text-slate-400">Ready to Pick</div>
                <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">{warehouseWorkflow?.summary?.readyToPick ?? snapshot.modules.warehouse.metrics?.readyToPick ?? 0}</div>
              </div>
              <div className="rounded-xl border border-white/20 bg-white/40 p-5 backdrop-blur-lg shadow-sm dark:border-slate-700/50 dark:bg-slate-800/40">
                <div className="text-sm text-slate-500 dark:text-slate-400">Packed</div>
                <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">{warehouseWorkflow?.summary?.packedCount ?? snapshot.modules.warehouse.metrics?.packedCount ?? 0}</div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 rounded-xl border border-white/20 bg-white/60 p-6 backdrop-blur-xl shadow-lg dark:border-slate-700/50 dark:bg-slate-800/60 flex flex-col">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Workflow Volume</h2>
              <div className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                Module Health: {snapshot.modules.warehouse.score}%
              </div>
            </div>
            <div className="flex-1 min-h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={[
                    { name: 'Picking', count: warehouseWorkflow?.summary?.readyToPick ?? snapshot.modules.warehouse.metrics?.readyToPick ?? 0 },
                    { name: 'Packing', count: warehouseWorkflow?.summary?.packedCount ?? snapshot.modules.warehouse.metrics?.packedCount ?? 0 },
                    { name: 'Shipping', count: warehouseWorkflow?.summary?.shipmentsInTransit ?? snapshot.modules.warehouse.metrics?.shipmentsInTransit ?? 0 },
                  ]}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" strokeOpacity={0.2} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} allowDecimals={false} />
                  <RechartsTooltip 
                    cursor={{fill: 'rgba(245, 158, 11, 0.05)'}}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: 'rgba(255,255,255,0.9)' }}
                  />
                  <Bar dataKey="count" name="Operations" radius={[4, 4, 0, 0]} barSize={40}>
                    <Cell fill="#f59e0b" />
                    <Cell fill="#f97316" />
                    <Cell fill="#eab308" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      <PageCard>
        <ListFilterBar
          model="product.product"
          value={filters}
          onChange={setFilters}
          onApply={() => setFilters((c) => ({ ...c }))}
          onClear={() => setFilters({ search: '', active: true, categoryId: undefined, locationId: undefined })}
          fields={['search', 'active', 'category', 'location']}
          categoryOptions={categories.map((c) => ({ value: c.id, label: c.name }))}
          locationOptions={locations.map((l) => ({ value: l.id, label: l.complete_name || l.name }))}
          loading={loading}
        />

        <div className="flex items-center gap-3 my-3">
          <input
            type="checkbox"
            id="showValueToggle"
            checked={showValue}
            onChange={(e) => setShowValue(e.target.checked)}
            className="form-checkbox"
          />
          <label htmlFor="showValueToggle" className="text-sm text-gray-700 dark:text-gray-300 select-none cursor-pointer">
            {t('showValue')}
          </label>
        </div>

        {inventorySummary && (
          <div className="mb-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
              Status: {inventorySummary.status}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              Reorder required: {inventorySummary.reorderRequired ? 'Yes' : 'No'}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              Transfer review: {inventorySummary.transferSuggested ? 'Suggested' : 'Not needed'}
            </span>
          </div>
        )}

        {error && (
          <div className="mb-4">
            <BackendStatusBanner message={error} onRetry={() => setFilters((c) => ({ ...c }))} />
          </div>
        )}

        <DataTable
          columns={columns}
          rows={items}
          rowKey="id"
          loading={loading}
          emptyTitle={t('noItemsForTenant')}
          emptyIcon="📦"
        />

        {!loading && !error && items.length > 0 && (
          <div className="mt-4 flex justify-between items-center text-xs text-gray-400">
            <span>{t('loadedItems', { count: items.length })}</span>
            {endReached && <span>{t('endOfResults')}</span>}
          </div>
        )}
      </PageCard>

      {showRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">{t('requestInventory') || 'Request Inventory'}</h2>
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
