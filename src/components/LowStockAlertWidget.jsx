import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import { getApiClient } from '../lib/apiClient';

const LOW_STOCK_THRESHOLD = 10;

export default function LowStockAlertWidget() {
  const { t } = useLang();
  const { currentUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const normalizeErrorMessage = (err) => {
    const raw = err?.response?.data?.error || err?.message || t('error');
    return raw;
  };

  useEffect(() => {
    let mounted = true;

    async function loadProducts() {
      setLoading(true);
      setError('');
      try {
        const result = await getApiClient().get('/api/inventory/products', { service: 'inventory' });
        const rows = result?.data || [];
        const normalized = rows.map((p) => ({
          id: p.id,
          name: p.name,
          product_code: p.product_code || p.sku,
          qty_available: Number(p.quantity_available ?? p.stock_quantity ?? p.quantity ?? 0),
        }));
        if (!mounted) return;
        setProducts(Array.isArray(normalized) ? normalized : []);
      } catch (err) {
        if (!mounted) return;
        setError(normalizeErrorMessage(err));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    if (authLoading || !currentUser) return undefined;
    loadProducts();
    return () => {
      mounted = false;
    };
  }, [authLoading, currentUser, t]);

  const lowStockItems = products.filter((product) => Number(product.qty_available) < LOW_STOCK_THRESHOLD);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-gray-900">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div>
          <p className="text-sm uppercase tracking-wide text-gray-500 dark:text-gray-400">{t('inventory')}</p>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{t('lowStockAlert')}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('lowStockThresholdNote', { threshold: LOW_STOCK_THRESHOLD })}</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/inventory')}
          className="rounded-full border border-slate-400 px-3 py-1 text-sm text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          {t('viewInventory')}
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500 dark:text-gray-400">{t('loadingLowStock')}</p>
      ) : error ? (
        <div className="space-y-3">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              setError('');
              getApiClient().get('/api/inventory/products', { service: 'inventory' })
                .then((result) => {
                  const rows = result?.data || [];
                  setProducts(rows.map((p) => ({
                    id: p.id,
                    name: p.name,
                    product_code: p.product_code || p.sku,
                    qty_available: Number(p.quantity_available ?? p.stock_quantity ?? p.quantity ?? 0),
                  })));
                })
                .catch((err) => setError(normalizeErrorMessage(err)))
                .finally(() => setLoading(false));
            }}
            className="rounded-md bg-violet-600 px-3 py-1 text-sm text-white hover:bg-violet-700"
          >
            {t('retry')}
          </button>
        </div>
      ) : lowStockItems.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">{t('noLowStockItems')}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left">
            <thead>
              <tr className="border-b border-slate-200 text-gray-600 dark:border-slate-700 dark:text-gray-300">
                <th className="py-2 pr-4">{t('sku')}</th>
                <th className="py-2 pr-4">{t('product')}</th>
                <th className="py-2 pr-4">{t('quantity')}</th>
              </tr>
            </thead>
            <tbody>
              {lowStockItems.map((product) => (
                <tr key={product.id} className="border-b last:border-b-0 border-slate-100 dark:border-slate-700">
                  <td className="py-3 pr-4 text-gray-700 dark:text-gray-200">{product.product_code || '—'}</td>
                  <td className="py-3 pr-4 font-medium text-slate-900 dark:text-slate-100">{product.name || '—'}</td>
                  <td className="py-3 pr-4 text-gray-700 dark:text-gray-200">{product.qty_available != null ? product.qty_available : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
            {t('loadedItems', { count: lowStockItems.length })}
          </div>
        </div>
      )}
    </section>
  );
}
