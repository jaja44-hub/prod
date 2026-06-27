import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOdooProducts } from '../services/ServiceGateway';

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [queryText, setQueryText] = useState('');
  const [endReached, setEndReached] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    async function loadProducts() {
      setLoading(true);
      setError('');
      try {
        const products = await getOdooProducts(50, ['id', 'name', 'default_code', 'qty_available', 'list_price']);
        if (!mounted) return;
        setItems(Array.isArray(products) ? products : []);
        setEndReached(true);
      } catch (err) {
        if (!mounted) return;
        setError(err?.message || 'Failed to load inventory from Odoo.');
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    }

    loadProducts();
    return () => {
      mounted = false;
    };
  }, []);

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
      <h1 className="text-2xl font-semibold mb-4">Inventory</h1>
      <p className="text-sm text-gray-600 mb-4">Production sector inventory items sourced from Odoo.</p>
      <div className="bg-white dark:bg-gray-800 p-4 rounded shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <input
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              placeholder="Search SKU or name"
              className="px-3 py-1 rounded border"
            />
            <button onClick={() => setQueryText('')} className="text-xs text-gray-500">
              Clear
            </button>
          </div>
          <div>
            <button onClick={openCreate} className="bg-violet-600 text-white px-3 py-1 rounded">
              New Item
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-gray-500">Loading…</p>
        ) : error ? (
          <div className="space-y-3">
            <p className="text-red-500">{error}</p>
            <button
              onClick={() => {
                setLoading(true);
                setError('');
                getOdooProducts(50, ['id', 'name', 'default_code', 'qty_available', 'list_price'])
                  .then((products) => setItems(Array.isArray(products) ? products : []))
                  .catch((err) => setError(err?.message || 'Failed to load inventory from Odoo.'))
                  .finally(() => setLoading(false));
              }}
              className="px-3 py-1 bg-violet-600 text-white rounded"
            >
              Retry
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-gray-500">No items found for this tenant.</p>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="py-2">SKU</th>
                  <th className="py-2">Name</th>
                  <th className="py-2">Qty</th>
                  <th className="py-2">Unit</th>
                  <th className="py-2">Location</th>
                  <th className="py-2"> </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((it) => (
                  <tr key={it.id} className="border-t">
                    <td className="py-2">{it.default_code || '—'}</td>
                    <td className="py-2">{it.name || '—'}</td>
                    <td className="py-2">{typeof it.qty_available === 'number' ? it.qty_available : '—'}</td>
                    <td className="py-2">{it.uom_id?.[1] || 'unit'}</td>
                    <td className="py-2">{it.location || 'N/A'}</td>
                    <td className="py-2">
                      <button onClick={() => openEdit(it)} className="text-xs text-violet-600">
                        View / Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex items-center justify-between mt-4">
              <div className="text-xs text-gray-500">Loaded {items.length} items</div>
              <div>
                <span className="text-xs text-gray-500">End of results</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
