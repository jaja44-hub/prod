import React, { useEffect, useState } from 'react';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import { getOdooProducts, getOdooCustomers, getOdooVendors, getOdooPurchaseOrders } from '../services/ServiceGateway';

const statCards = [
  { key: 'products', labelKey: 'products', icon: '📦' },
  { key: 'customers', labelKey: 'customers', icon: '👥' },
  { key: 'vendors', labelKey: 'vendors', icon: '🏭' },
  { key: 'purchaseOrders', labelKey: 'purchaseOrders', icon: '🧾' },
];

function ErpSummaryPanel() {
  const { t } = useLang();
  const [stats, setStats] = useState({ products: 0, customers: 0, vendors: 0, purchaseOrders: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function fetchStats() {
      setLoading(true);
      setError(false);
      try {
        const [products, customers, vendors, purchaseOrders] = await Promise.all([
          getOdooProducts(500, ['id']),
          getOdooCustomers(500),
          getOdooVendors(500),
          getOdooPurchaseOrders(500),
        ]);
        if (!mounted) return;
        setStats({
          products: Array.isArray(products) ? products.length : 0,
          customers: Array.isArray(customers) ? customers.length : 0,
          vendors: Array.isArray(vendors) ? vendors.length : 0,
          purchaseOrders: Array.isArray(purchaseOrders)
            ? purchaseOrders.filter((order) => ['draft', 'sent', 'purchase'].includes(order.state)).length
            : 0,
        });
      } catch (err) {
        console.error('ErpSummaryPanel error', err);
        if (mounted) setError(true);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchStats();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section className="mb-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div>
          <p className="text-sm uppercase tracking-wide text-gray-500 dark:text-gray-400">ERP Summary</p>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{t('dashboard')} Overview</h2>
        </div>
        {error && (
          <span
            className="inline-flex items-center gap-1 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200 px-3 py-1 text-xs font-semibold"
            title={errorDetail}
          >
            ⚠ {errorDetail.includes('waking up') ? t('backendWakingUp') : t('odooConnectionError')}
          </span>
        )}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <div key={card.key} className="rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-sm transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between mb-3">
              <div className="text-lg">{card.icon}</div>
              <div className="text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">{t(card.labelKey)}</div>
            </div>
            <div className="min-h-[48px] text-3xl font-semibold text-slate-900 dark:text-slate-100">
              {loading ? <span className="animate-pulse bg-slate-200/70 text-transparent rounded-md">000</span> : stats[card.key]}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{loading ? t('loading') : ''}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default ErpSummaryPanel;
