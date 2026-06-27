import React, { useEffect, useState } from 'react';
import { useLang } from '../context/LangContext';
import { getOdooSalesOrders, getOdooManufacturingOrders } from '../services/ServiceGateway';

export default function RecentOrdersWidget() {
  const { t } = useLang();
  const [sales, setSales] = useState([]);
  const [mrp, setMrp] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function fetchOrders() {
      try {
        const [salesRes, mrpRes] = await Promise.all([
          getOdooSalesOrders(5),
          getOdooManufacturingOrders(5)
        ]);
        if (mounted) {
          setSales(Array.isArray(salesRes) ? salesRes : []);
          setMrp(Array.isArray(mrpRes) ? mrpRes : []);
        }
      } catch (err) {
        console.error('Failed to fetch recent orders:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchOrders();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
      {/* Recent Sales */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-slate-200 dark:border-gray-700 p-5">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">{t('sales')} (Recent)</h2>
        {loading ? (
          <div className="animate-pulse flex space-x-4">
            <div className="flex-1 space-y-4 py-1">
              <div className="h-4 bg-slate-200 rounded w-3/4"></div>
              <div className="h-4 bg-slate-200 rounded"></div>
            </div>
          </div>
        ) : sales.length === 0 ? (
          <p className="text-gray-500 text-sm">{t('noResults')}</p>
        ) : (
          <ul className="space-y-3">
            {sales.map((order) => (
              <li key={order.id} className="flex justify-between items-center text-sm border-b border-gray-100 dark:border-gray-700 pb-2">
                <span className="font-medium text-slate-800 dark:text-slate-200">{order.name}</span>
                <span className="text-gray-500 truncate w-32">{order.partner_id?.[1] || 'Unknown'}</span>
                <span className="text-emerald-600 font-semibold">${order.amount_total?.toLocaleString() || 0}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Recent Manufacturing */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-slate-200 dark:border-gray-700 p-5">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">{t('manufacturing')} (Recent)</h2>
        {loading ? (
          <div className="animate-pulse flex space-x-4">
            <div className="flex-1 space-y-4 py-1">
              <div className="h-4 bg-slate-200 rounded w-3/4"></div>
              <div className="h-4 bg-slate-200 rounded"></div>
            </div>
          </div>
        ) : mrp.length === 0 ? (
          <p className="text-gray-500 text-sm">{t('noResults')}</p>
        ) : (
          <ul className="space-y-3">
            {mrp.map((order) => (
              <li key={order.id} className="flex justify-between items-center text-sm border-b border-gray-100 dark:border-gray-700 pb-2">
                <span className="font-medium text-slate-800 dark:text-slate-200">{order.name}</span>
                <span className="text-gray-500 truncate w-32">{order.product_id?.[1] || 'Unknown'}</span>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold uppercase">{order.state}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
