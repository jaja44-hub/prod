import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import { getInventoryProducts, getInventoryLocations } from '../lib/neonWarehouseAPI';
import { getApiClient } from '../lib/apiClient';
import PageHeader from '../components/PageHeader';
import PageCard from '../components/PageCard';
import { buildInventoryInsights } from '../lib/inventoryDepth';

export default function ItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLang();
  const { currentUser, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [item, setItem] = useState(null);
  const [locations, setLocations] = useState([]);
  const [quants, setQuants] = useState([]);
  const [inventoryInsights, setInventoryInsights] = useState(null);
  const [form, setForm] = useState({ default_code: '', name: '', list_price: 0, category: '' });

  const normalizeErrorMessage = (err) => {
    const raw = err?.error || err?.message || t('error');
    return raw;
  };

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const [locationsResult, productsResult] = await Promise.all([
          getInventoryLocations({ tenant_id: 'tenant_default' }),
          id && id !== 'new' ? getInventoryProducts({ tenant_id: 'tenant_default', search: id }) : Promise.resolve(null),
        ]);
        if (mounted) {
          const locRows = locationsResult?.data || locationsResult || [];
          setLocations(Array.isArray(locRows) ? locRows : []);
          if (productsResult && productsResult.data) {
            const productList = Array.isArray(productsResult.data) ? productsResult.data : [];
            const productItem = productList.find((p) => String(p.id) === String(id)) || productList[0];
            if (productItem) {
              setItem(productItem);
              setForm({
                default_code: productItem?.product_code || '',
                name: productItem?.name || '',
                list_price: productItem?.selling_price ?? productItem?.unit_price ?? 0,
                category: productItem?.category || '',
              });
              setInventoryInsights(buildInventoryInsights(productItem, { stock_quantity: productItem.stock_quantity }));
              // Stock-by-location is surfaced from location rows w/ matching product data.
              const stockRows = (Array.isArray(locRows) ? locRows : []).map((loc, idx) => ({
                id: loc.id || idx,
                location_id: loc.name ? [loc.id, loc.name] : [null, 'Unknown'],
                quantity: Number(productItem?.stock_quantity ?? 0),
                reserved_quantity: 0,
              }));
              setQuants(stockRows);
            }
          }
        }
      } catch (err) {
        if (mounted) setError(normalizeErrorMessage(err));
      } finally {
        if (mounted) setLoading(false);
      }
    }
    if (authLoading || !currentUser) return;
    load();
    return () => (mounted = false);
  }, [id, authLoading, currentUser]);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (id === 'new') {
        const result = await getApiClient().post('/api/inventory/products', {
          product_code: form.default_code,
          name: form.name,
          category: form.category,
          quantity: 0,
          unit_price: Number(form.list_price || 0),
        }, { service: 'inventory' });
        const created = result?.data || result;
        if (!created?.id) {
          throw new Error('Failed to create product.');
        }
        navigate(`/inventory/${created.id}`);
        return;
      }

      const result = await getApiClient().post(`/api/inventory/products/${id}`, {
        product_code: form.default_code,
        name: form.name,
        category: form.category,
        unit_price: Number(form.list_price || 0),
      }, { service: 'inventory' });
      const updated = result?.data || result;
      setItem(updated);
      setForm({
        default_code: updated?.product_code || updated?.default_code || '',
        name: updated?.name || '',
        list_price: Number(updated?.selling_price ?? updated?.unit_price ?? 0),
        category: updated?.category || '',
      });
    } catch (err) {
      setError(normalizeErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="max-w-4xl space-y-6">
      <PageHeader
        title={id === 'new' ? t('newProduct') : `${t('product')} ${item?.product_code || id}`}
        subtitle="Manage product SKU, selling price, categories, and track multi-location warehouse stock."
      />

      <PageCard>
        {loading ? (
          <div className="text-center py-10 text-gray-500">{t('loading')}</div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm dark:bg-red-900/30 dark:border-red-800 dark:text-red-400">
            {error}
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">{t('sku')}</label>
                <input
                  value={form.default_code}
                  onChange={(e) => setForm({ ...form, default_code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900 focus:outline-none focus:border-violet-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">{t('name')}</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900 focus:outline-none focus:border-violet-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">{t('category')}</label>
                <input
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900 focus:outline-none focus:border-violet-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">{t('price')}</label>
                <input
                  type="number"
                  value={form.list_price}
                  onChange={(e) => setForm({ ...form, list_price: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900 focus:outline-none focus:border-violet-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
              <button type="button" onClick={() => navigate('/inventory')} className="btn-secondary">
                {t('cancel')}
              </button>
              <button type="submit" className="btn-primary">
                {t('save')}
              </button>
            </div>
          </form>
        )}
      </PageCard>

      {id && id !== 'new' && inventoryInsights && (
        <PageCard>
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="rounded-lg border border-gray-200 dark:border-gray-800 px-3 py-2 text-sm">
              <div className="text-[11px] uppercase tracking-wide text-gray-500">Status</div>
              <div className="font-semibold text-gray-900 dark:text-white">{inventoryInsights.status}</div>
            </div>
            <div className="rounded-lg border border-gray-200 dark:border-gray-800 px-3 py-2 text-sm">
              <div className="text-[11px] uppercase tracking-wide text-gray-500">Available after reserve</div>
              <div className="font-semibold text-gray-900 dark:text-white">{inventoryInsights.availableAfterReserve}</div>
            </div>
            <div className="rounded-lg border border-gray-200 dark:border-gray-800 px-3 py-2 text-sm">
              <div className="text-[11px] uppercase tracking-wide text-gray-500">Reorder required</div>
              <div className="font-semibold text-gray-900 dark:text-white">{inventoryInsights.reorderRequired ? 'Yes' : 'No'}</div>
            </div>
            <div className="rounded-lg border border-gray-200 dark:border-gray-800 px-3 py-2 text-sm">
              <div className="text-[11px] uppercase tracking-wide text-gray-500">Transfer review</div>
              <div className="font-semibold text-gray-900 dark:text-white">{inventoryInsights.transferSuggested ? 'Suggested' : 'Not needed'}</div>
            </div>
          </div>
        </PageCard>
      )}

      {/* Stock by location panel */}
      {id && id !== 'new' && (
        <PageCard>
          <h3 className="font-semibold text-sm mb-3 text-gray-900 dark:text-white">{t('stockByLocation')}</h3>
          {quants.length === 0 ? (
            <p className="text-xs text-gray-500 dark:text-gray-400 py-2">{t('noStockData')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-gray-700 dark:text-gray-300">
                <thead>
                  <tr className="text-gray-500 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800">
                    <th className="py-2 pb-3 font-semibold">{t('location')}</th>
                    <th className="py-2 pb-3 font-semibold text-right">{t('onHand')}</th>
                    <th className="py-2 pb-3 font-semibold text-right">{t('reserved')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150/40 dark:divide-gray-800">
                  {quants.map((quant) => (
                    <tr key={quant.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-850/50">
                      <td className="py-2">{quant.location_id?.[1] || '—'}</td>
                      <td className="py-2 text-right">{typeof quant.quantity === 'number' ? quant.quantity : '—'}</td>
                      <td className="py-2 text-right">{typeof quant.reserved_quantity === 'number' ? quant.reserved_quantity : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </PageCard>
      )}
    </section>
  );
}
