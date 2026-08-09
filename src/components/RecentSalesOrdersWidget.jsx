import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import { getApiClient } from '../lib/apiClient';

export default function RecentSalesOrdersWidget() {
  const { t } = useLang();
  const { currentUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const normalizeErrorMessage = (err) => {
    const raw = err?.response?.data?.error || err?.message || t('error');
    return raw;
  };

  useEffect(() => {
    let mounted = true;

    async function loadSales() {
      setLoading(true);
      setError('');
      try {
        const result = await getApiClient().get('/api/sales/orders', { service: 'sales' });
        const rows = result?.data || [];
        const normalized = rows.map((r) => ({
          id: r.id,
          name: r.order_number || r.name,
          partner_name: r.customer_name || 'Unknown',
          amount_total: Number(r.total_amount ?? r.amount_total ?? 0),
          state: r.status || r.state || '',
          date_order: r.order_date || r.created_at || '',
        }));
        if (!mounted) return;
        setOrders(Array.isArray(normalized) ? normalized : []);
      } catch (err) {
        if (!mounted) return;
        setError(normalizeErrorMessage(err));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    if (authLoading || !currentUser) return undefined;
    loadSales();
    return () => {
      mounted = false;
    };
  }, [authLoading, currentUser, t]);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-gray-900">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div>
          <p className="text-sm uppercase tracking-wide text-gray-500 dark:text-gray-400">{t('salesOrders')}</p>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{t('recentSalesOrders')}</h3>
        </div>
        <button
          type="button"
          onClick={() => navigate('/sales')}
          className="rounded-full border border-violet-600 px-3 py-1 text-sm text-violet-600 transition hover:bg-violet-50 dark:border-violet-400 dark:text-violet-200 dark:hover:bg-violet-900/40"
        >
          {t('viewAllSales')}
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500 dark:text-gray-400">{t('loadingRecentSales')}</p>
      ) : error ? (
        <div className="space-y-3">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              setError('');
              getApiClient().get('/api/sales/orders', { service: 'sales' })
                .then((result) => {
                  const rows = result?.data || [];
                  setOrders(rows.map((r) => ({
                    id: r.id,
                    name: r.order_number || r.name,
                    partner_name: r.customer_name || 'Unknown',
                    amount_total: Number(r.total_amount ?? r.amount_total ?? 0),
                    state: r.status || r.state || '',
                    date_order: r.order_date || r.created_at || '',
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
      ) : orders.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">{t('noRecentSalesOrders')}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left">
            <thead>
              <tr className="border-b border-slate-200 text-gray-600 dark:border-slate-700 dark:text-gray-300">
                <th className="py-2 pr-4">{t('order')}</th>
                <th className="py-2 pr-4">{t('partner')}</th>
                <th className="py-2 pr-4">{t('amount')}</th>
                <th className="py-2 pr-4">{t('state')}</th>
                <th className="py-2 pr-4">{t('dateOrder')}</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b last:border-b-0 border-slate-100 dark:border-slate-700">
                  <td className="py-3 pr-4 font-medium text-slate-900 dark:text-slate-100">{order.name || '—'}</td>
                  <td className="py-3 pr-4 text-gray-500 dark:text-gray-300">{order.partner_name || '—'}</td>
                  <td className="py-3 pr-4 text-gray-700 dark:text-gray-200">{order.amount_total != null ? order.amount_total.toLocaleString() : '—'}</td>
                  <td className="py-3 pr-4 text-gray-700 dark:text-gray-200">{order.state || '—'}</td>
                  <td className="py-3 pr-4 text-gray-700 dark:text-gray-200">{order.date_order || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
            {t('loadedOrders', { count: orders.length })}
          </div>
        </div>
      )}
    </section>
  );
}
