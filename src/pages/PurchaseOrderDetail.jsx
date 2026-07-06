import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import {
  getOdooPurchaseOrder,
  createOdooPurchaseOrder,
  getOdooVendors,
  getOdooProducts,
  BACKEND_WAKEUP_MESSAGE,
} from '../services/ServiceGateway';
import PageHeader from '../components/PageHeader';
import PageCard from '../components/PageCard';
import StateBadge from '../components/StateBadge';

export default function PurchaseOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLang();
  const { currentUser, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [order, setOrder] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    partner_id: '',
    origin: '',
    product_id: '',
    quantity: 1,
    unitPrice: 0,
  });

  const normalizeErrorMessage = (err) => {
    const raw = err?.response?.data?.error || err?.message || t('error');
    return raw === BACKEND_WAKEUP_MESSAGE ? t('backendWakingUp') : raw;
  };

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError('');

      try {
        const [vendorResult, productResult] = await Promise.all([
          getOdooVendors(50),
          getOdooProducts(50, ['id', 'name', 'default_code', 'qty_available', 'list_price', 'uom_id']),
        ]);

        if (!mounted) return;
        setVendors(Array.isArray(vendorResult) ? vendorResult : []);
        setProducts(Array.isArray(productResult) ? productResult : []);

        if (id && id !== 'new') {
          const existingOrder = await getOdooPurchaseOrder(id);
          if (!mounted) return;
          setOrder(existingOrder);
          setForm({
            partner_id: existingOrder?.partner_id?.[0] || '',
            origin: existingOrder?.origin || '',
            product_id: existingOrder?.order_lines?.[0]?.product_id?.[0] || '',
            quantity: existingOrder?.order_lines?.[0]?.product_qty || 1,
            unitPrice: existingOrder?.order_lines?.[0]?.price_unit || 0,
          });
        }
      } catch (err) {
        if (!mounted) return;
        setError(normalizeErrorMessage(err));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    if (authLoading || !currentUser) return;
    load();
    return () => { mounted = false; };
  }, [id, authLoading, currentUser, t]);

  useEffect(() => {
    if (!form.product_id || products.length === 0) return;
    const selectedProduct = products.find((product) => Number(product.id) === Number(form.product_id));
    if (selectedProduct) {
      setForm((prev) => ({ ...prev, unitPrice: selectedProduct.list_price || prev.unitPrice }));
    }
  }, [form.product_id, products]);

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (id === 'new') {
        const created = await createOdooPurchaseOrder({
          partner_id: form.partner_id,
          origin: form.origin,
          lines: [
            {
              product_id: form.product_id,
              quantity: form.quantity,
              unitPrice: form.unitPrice,
            },
          ],
        }, { actorUid: currentUser?.uid });

        if (!created?.id) {
          throw new Error(t('purchaseOrderCreateFailed'));
        }

        navigate(`/purchases/${created.id}`);
        return;
      }
    } catch (err) {
      setError(normalizeErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="max-w-4xl space-y-6">
      <PageHeader
        title={id === 'new' ? t('createPurchaseOrder') : `${t('order')} ${order?.name || id}`}
        subtitle="Manage incoming supplier receipts, material replenishment lines, and order status tracking."
      />

      <PageCard>
        {loading ? (
          <div className="text-center py-10 text-gray-500">{t('loadingPurchases')}</div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm dark:bg-red-900/30 dark:border-red-800 dark:text-red-400">
            {error}
          </div>
        ) : id === 'new' ? (
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">{t('vendor')}</label>
                <select
                  value={form.partner_id}
                  onChange={(e) => setForm({ ...form, partner_id: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900 focus:outline-none focus:border-violet-500 dark:text-gray-150"
                >
                  <option value="">{t('selectVendor')}</option>
                  {vendors.map((vendor) => (
                    <option key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">{t('orderReference')}</label>
                <input
                  value={form.origin}
                  onChange={(e) => setForm({ ...form, origin: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900 focus:outline-none focus:border-violet-500 dark:text-gray-150"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">{t('selectProduct')}</label>
                <select
                  value={form.product_id}
                  onChange={(e) => setForm({ ...form, product_id: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900 focus:outline-none focus:border-violet-500 dark:text-gray-150"
                >
                  <option value="">{t('selectProduct')}</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">{t('quantity')}</label>
                <input
                  type="number"
                  min="1"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900 focus:outline-none focus:border-violet-500 dark:text-gray-150"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">{t('unitPrice')}</label>
                <input
                  type="number"
                  min="0"
                  value={form.unitPrice}
                  onChange={(e) => setForm({ ...form, unitPrice: Number(e.target.value) })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900 focus:outline-none focus:border-violet-500 dark:text-gray-150"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
              <button type="button" onClick={() => navigate('/purchases')} className="btn-secondary">
                {t('cancel')}
              </button>
              <button type="submit" className="btn-primary">
                {t('save')}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200/50 dark:border-gray-800">
                <div className="text-[10px] uppercase font-bold tracking-wider text-gray-400 dark:text-gray-505 mb-1">{t('vendor')}</div>
                <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">{order?.partner_id?.[1] || '—'}</div>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200/50 dark:border-gray-800">
                <div className="text-[10px] uppercase font-bold tracking-wider text-gray-400 dark:text-gray-505 mb-1">{t('orderReference')}</div>
                <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">{order?.origin || '—'}</div>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200/50 dark:border-gray-800">
                <div className="text-[10px] uppercase font-bold tracking-wider text-gray-400 dark:text-gray-505 mb-1">{t('state')}</div>
                <div className="mt-0.5">
                  <StateBadge state={order?.state || 'neutral'} label={order?.state || '—'} />
                </div>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200/50 dark:border-gray-800">
                <div className="text-[10px] uppercase font-bold tracking-wider text-gray-400 dark:text-gray-505 mb-1">{t('amount')}</div>
                <div className="text-sm font-bold text-violet-750 dark:text-violet-400">{order?.amount_total != null ? `${order.amount_total.toFixed(2)} ETB` : '—'}</div>
              </div>
            </div>

            <div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white mb-3">{t('orderLines')}</div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-gray-700 dark:text-gray-300">
                  <thead>
                    <tr className="text-gray-500 uppercase tracking-wider border-b border-gray-150 dark:border-gray-800">
                      <th className="py-2 pb-3 font-semibold">{t('product')}</th>
                      <th className="py-2 pb-3 font-semibold text-right">{t('quantity')}</th>
                      <th className="py-2 pb-3 font-semibold text-right">{t('unitPrice')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-150/40 dark:divide-gray-850">
                    {(order?.order_lines || []).map((line) => (
                      <tr key={line.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-850/50">
                        <td className="py-2">{line.product_id?.[1] || '—'}</td>
                        <td className="py-2 text-right font-mono">{line.product_qty != null ? line.product_qty : '—'}</td>
                        <td className="py-2 text-right font-mono">{line.price_unit != null ? `${line.price_unit.toFixed(2)} ETB` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-800">
              <button onClick={() => navigate('/purchases')} className="btn-secondary">
                {t('back')}
              </button>
            </div>
          </div>
        )}
      </PageCard>
    </section>
  );
}
