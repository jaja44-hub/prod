import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext'
import { getOdooProducts, BACKEND_WAKEUP_MESSAGE } from '../services/ServiceGateway';

export default function Inventory() {
  const { t } = useLang()
  const { currentUser, loading: authLoading } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [queryText, setQueryText] = useState('');
  const [endReached, setEndReached] = useState(true);

  const normalizeErrorMessage = (err) => {
    const raw = err?.response?.data?.error || err?.message || t('error')
    return raw === BACKEND_WAKEUP_MESSAGE ? t('backendWakingUp') : raw
  }

  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    async function loadProducts() {
      setLoading(true);
      setError('');
      try {
        const products = await getOdooProducts(50, ['id', 'name', 'default_code', 'qty_available', 'list_price', 'uom_id', 'location']);
        if (!mounted) return;
        setItems(Array.isArray(products) ? products : []);
        setEndReached(true);
      } catch (err) {
        if (!mounted) return;
        setError(normalizeErrorMessage(err));
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    }

    if (authLoading || !currentUser) return;
    loadProducts();
    return () => {
      mounted = false;
    };
  }, [authLoading, currentUser]);

  const filtered = items.filter((it) => {
    if (!queryText) return true;
    const q = queryText.toLowerCase();
    return (it.name || '').toLowerCase().includes(q) || (it.default_code || '').toLowerCase().includes(q);
  });

  function openCreate() {
    navigate('/inventory/new');
  }

  function openEdit(it) {
    if (it && it.id) navigate(`/inventory/${it.id}`);
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">{t('inventory')}</h1>
      <p className="text-sm text-gray-600 mb-4">{t('inventoryDescription')}</p>
      <div className="bg-white dark:bg-gray-800 p-4 rounded shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <input
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              placeholder={t('searchSkuOrName')}
              className="px-3 py-1 rounded border"
            />
            <button onClick={() => setQueryText('')} className="text-xs text-gray-500">
              {t('clear')}
            </button>
          </div>
          <div>
            <button onClick={openCreate} className="bg-violet-600 text-white px-3 py-1 rounded">
              {t('addItem')}
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-gray-500">{t('loadingInventory')}</p>
        ) : error ? (
          <div className="space-y-3">
            <p className="text-red-500">{error}</p>
            <button
              onClick={() => {
                setLoading(true);
                setError('');
                getOdooProducts(50, ['id', 'name', 'default_code', 'qty_available', 'list_price', 'uom_id', 'location'])
                  .then((products) => setItems(Array.isArray(products) ? products : []))
                  .catch((err) => setError(normalizeErrorMessage(err)))
                  .finally(() => setLoading(false));
              }}
              className="px-3 py-1 bg-violet-600 text-white rounded"
            >
              {t('retry')}
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-gray-500">{t('noItemsForTenant')}</p>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="py-2">{t('sku')}</th>
                  <th className="py-2">{t('name')}</th>
                  <th className="py-2">{t('quantity')}</th>
                  <th className="py-2">{t('unit')}</th>
                  <th className="py-2">{t('location')}</th>
                  <th className="py-2">{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((it) => (
                  <tr key={it.id} className="border-t">
                    <td className="py-2">{it.default_code || '—'}</td>
                    <td className="py-2">{it.name || '—'}</td>
                    <td className="py-2">{typeof it.qty_available === 'number' ? it.qty_available : '—'}</td>
                    <td className="py-2">{it.uom_id?.[1] || t('unit')}</td>
                    <td className="py-2">{it.location || t('notAvailable')}</td>
                    <td className="py-2">
                      <button onClick={() => openEdit(it)} className="text-xs text-violet-600">
                        {t('viewEdit')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex items-center justify-between mt-4">
              <div className="text-xs text-gray-500">{t('loadedItems', { count: items.length })}</div>
              <div>
                <span className="text-xs text-gray-500">{t('endOfResults')}</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
