import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import { getOdooProducts, getOdooProductsByLocation, getOdooProductCategories, getOdooStockLocations, BACKEND_WAKEUP_MESSAGE } from '../services/ServiceGateway';
import ListFilterBar from '../components/ListFilterBar';
import PageHeader from '../components/PageHeader';
import PageCard from '../components/PageCard';
import DataTable from '../components/DataTable';
import BackendStatusBanner from '../components/BackendStatusBanner';
import { formatEtb } from '../lib/formatEtb';

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

  const normalizeErrorMessage = (err) => {
    const raw = err?.response?.data?.error || err?.message || t('error');
    return raw === BACKEND_WAKEUP_MESSAGE ? t('backendWakingUp') : raw;
  };

  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    async function loadProducts(initialFilters) {
      setLoading(true);
      setError('');
      try {
        const fields = showValue
          ? ['id', 'name', 'default_code', 'qty_available', 'list_price', 'uom_id', 'categ_id', 'total_value']
          : ['id', 'name', 'default_code', 'qty_available', 'list_price', 'uom_id', 'categ_id'];
        const productFetcher = initialFilters.locationId
          ? getOdooProductsByLocation(initialFilters.locationId, { search: initialFilters.search || undefined, active: initialFilters.active, categoryId: initialFilters.categoryId }, 50)
          : getOdooProducts(50, fields, { search: initialFilters.search || undefined, active: initialFilters.active, categoryId: initialFilters.categoryId });
        const products = await productFetcher;
        if (!mounted) return;
        const list = Array.isArray(products) ? products : [];
        setItems(list);
        setEndReached(list.length < 50);
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
        const [categoryResult, locationResult] = await Promise.all([
          getOdooProductCategories(100, {}),
          getOdooStockLocations(100, {}),
        ]);
        if (!mounted) return;
        setCategories(Array.isArray(categoryResult) ? categoryResult : []);
        setLocations(Array.isArray(locationResult) ? locationResult : []);
      } catch { /* option load failures are non-fatal */ }
    }
    if (authLoading || !currentUser) return;
    loadOptions();
    return () => { mounted = false; };
  }, [authLoading, currentUser]);

  const columns = [
    { key: 'default_code', header: t('sku'), render: (r) => r.default_code || '—' },
    { key: 'name', header: t('name') },
    { key: 'categ_id', header: t('category'), render: (r) => r.categ_id?.[1] || '—' },
    { key: 'qty_available', header: t('quantity'), className: 'erp-num', render: (r) => typeof r.qty_available === 'number' ? r.qty_available : '—' },
    { key: 'uom_id', header: t('unit'), render: (r) => r.uom_id?.[1] || t('unit') },
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
          <button onClick={() => navigate('/inventory/new')} className="btn-primary">
            + {t('addItem')}
          </button>
        }
      />

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
    </section>
  );
}
