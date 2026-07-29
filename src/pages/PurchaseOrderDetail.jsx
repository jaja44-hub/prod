import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import {
  getSuppliers,
  getPurchaseOrder,
  createPurchaseOrder,
  submitPurchaseOrder,
  approvePurchaseOrder,
  sendPurchaseOrderToSupplier,
  acknowledgePurchaseOrder,
  validatePOBudget
} from '../lib/neonPurchaseAPI';
import { getInventoryProducts, createWarehouseReceiptFromPO } from '../lib/neonWarehouseAPI';
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
    supplier_id: '',
    category_id: '',
    payment_terms: 'net_30',
    delivery_terms: 'fob',
    shipping_method: 'standard',
    shipping_address: '',
    expected_delivery_date: '',
    notes: '',
    internal_notes: '',
    budget_id: '',
    items: []
  });
  const [receiptLocation, setReceiptLocation] = useState('');
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [receiptMessage, setReceiptMessage] = useState('');
  const [receiptError, setReceiptError] = useState('');
  const [lineForm, setLineForm] = useState({
    product_id: '',
    product_name: '',
    product_description: '',
    category_id: null,
    quantity: 1,
    unit_price: 0,
    unit_of_measure: 'pcs',
    expected_delivery_date: '',
    notes: ''
  });

  const normalizeErrorMessage = (err) => {
    const raw = err?.response?.data?.error || err?.message || err?.error || t('error');
    return raw === 'Backend is waking up' ? t('backendWakingUp') : raw;
  };

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError('');

      try {
        const [supplierResponse, productResponse] = await Promise.all([
          getSuppliers({ tenant_id: 'tenant_default', active: true }),
          getInventoryProducts({ tenant_id: 'tenant_default', limit: 200 })
        ]);

        if (!mounted) return;
        setVendors(Array.isArray(supplierResponse.data) ? supplierResponse.data : []);
        setProducts(Array.isArray(productResponse.data) ? productResponse.data : []);

        if (id && id !== 'new') {
          const existingResponse = await getPurchaseOrder(id);
          if (!mounted) return;
          setOrder(existingResponse.data);
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
    if (!lineForm.product_id || products.length === 0) return;
    const selectedProduct = products.find((product) => String(product.id) === String(lineForm.product_id));
    if (selectedProduct) {
      setLineForm((prev) => ({
        ...prev,
        product_name: selectedProduct.name || prev.product_name,
        product_description: selectedProduct.description || selectedProduct.name || prev.product_description,
        category_id: selectedProduct.category_id || prev.category_id,
        unit_price: Number(selectedProduct.unit_price || selectedProduct.price || selectedProduct.cost || selectedProduct.standard_price || 0)
      }));
    }
  }, [lineForm.product_id, products]);

  function addLineItem() {
    setError('');

    if (!lineForm.product_id) {
      setError(t('selectProduct'));
      return;
    }

    if (!lineForm.quantity || lineForm.quantity <= 0) {
      setError(t('quantityMustBeGreaterThanZero'));
      return;
    }

    const newItem = {
      product_id: Number(lineForm.product_id),
      product_name: lineForm.product_name || 'Unknown product',
      product_description: lineForm.product_description,
      category_id: lineForm.category_id,
      quantity: Number(lineForm.quantity),
      unit_price: Number(lineForm.unit_price),
      unit_of_measure: lineForm.unit_of_measure || 'pcs',
      expected_delivery_date: lineForm.expected_delivery_date,
      notes: lineForm.notes
    };

    setForm((prev) => ({
      ...prev,
      items: [...prev.items, newItem]
    }));

    setLineForm({
      product_id: '',
      product_name: '',
      product_description: '',
      category_id: null,
      quantity: 1,
      unit_price: 0,
      unit_of_measure: 'pcs',
      expected_delivery_date: '',
      notes: ''
    });
  }

  function removeLineItem(index) {
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, idx) => idx !== index)
    }));
  }

  async function refreshOrder() {
    if (!id || id === 'new') return;
    try {
      const result = await getPurchaseOrder(id);
      setOrder(result.data);
    } catch (err) {
      setError(normalizeErrorMessage(err));
    }
  }

  async function handleSubmitOrder() {
    if (!order?.id) return;
    setLoading(true);
    setError('');
    try {
      if (order?.budget_id && !order?.budget_validated) {
        const validation = await validatePOBudget(order.id);
        if (!validation?.data?.valid) {
          throw new Error(validation?.data?.message || t('budgetValidationFailed') || 'Budget validation failed');
        }
      }

      await submitPurchaseOrder(order.id, {
        submitter_id: currentUser?.uid,
        submitter_name: currentUser?.displayName || 'System'
      });
      await refreshOrder();
    } catch (err) {
      setError(normalizeErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleValidateOrderBudget() {
    if (!order?.id) return;
    setLoading(true);
    setError('');
    try {
      const validation = await validatePOBudget(order.id);
      setOrder((prev) => ({
        ...prev,
        budget_validated: validation?.data?.valid,
        budget_validation_message: validation?.data?.message || prev?.budget_validation_message
      }));
    } catch (err) {
      setError(normalizeErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleApproveOrder() {
    if (!order?.id) return;
    setLoading(true);
    setError('');
    try {
      await approvePurchaseOrder(order.id, {
        approver_id: currentUser?.uid,
        approver_name: currentUser?.displayName || 'System'
      });
      await refreshOrder();
    } catch (err) {
      setError(normalizeErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleSendOrder() {
    if (!order?.id) return;
    setLoading(true);
    setError('');
    try {
      await sendPurchaseOrderToSupplier(order.id, {
        sender_id: currentUser?.uid,
        sender_name: currentUser?.displayName || 'System'
      });
      await refreshOrder();
    } catch (err) {
      setError(normalizeErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleAcknowledgeOrder() {
    if (!order?.id) return;
    setLoading(true);
    setError('');
    try {
      await acknowledgePurchaseOrder(order.id);
      await refreshOrder();
    } catch (err) {
      setError(normalizeErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateReceipt() {
    if (!order?.id) return;
    setReceiptLoading(true);
    setReceiptError('');
    setReceiptMessage('');

    try {
      const receiptData = {
        tenant_id: order.tenant_id || 'tenant_default',
        received_by: currentUser?.id || 'system',
        received_by_name: currentUser?.name || 'System User',
        delivery_location: receiptLocation || 'Main Warehouse',
        notes: `Receipt created for PO ${order.po_number}`,
        items: (order.items || []).map((item) => ({
          po_item_id: item.id,
          product_id: item.product_id,
          product_name: item.product_name,
          quantity_received: item.quantity_ordered,
          unit_of_measure: item.unit_of_measure,
          unit_price: item.unit_price,
          notes: item.notes || `Received against PO ${order.po_number}`
        }))
      };

      const response = await createWarehouseReceiptFromPO(order.id, receiptData);
      const receiptNumber = response?.data?.receipt_number || response?.receipt_number;
      setReceiptMessage(receiptNumber
        ? t('receiptCreatedSuccessfully') + ` (${receiptNumber})`
        : t('receiptCreatedSuccessfully'));
    } catch (err) {
      setReceiptError(normalizeErrorMessage(err));
    } finally {
      setReceiptLoading(false);
    }
  }

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (id === 'new') {
        if (!form.supplier_id) {
          throw new Error(t('vendorRequired'));
        }

        if (!form.items.length) {
          throw new Error(t('addAtLeastOneOrderLine'));
        }

        const payload = {
          tenant_id: 'tenant_default',
          supplier_id: Number(form.supplier_id),
          category_id: form.category_id ? Number(form.category_id) : (form.items[0].category_id || null),
          payment_terms: form.payment_terms,
          delivery_terms: form.delivery_terms,
          shipping_method: form.shipping_method,
          shipping_address: form.shipping_address,
          expected_delivery_date: form.expected_delivery_date,
          notes: form.notes,
          internal_notes: form.internal_notes,
          budget_id: form.budget_id ? Number(form.budget_id) : null,
          items: form.items.map((item) => ({
            product_id: item.product_id,
            product_name: item.product_name,
            product_description: item.product_description,
            category_id: item.category_id,
            quantity: item.quantity,
            unit_of_measure: item.unit_of_measure,
            unit_price: item.unit_price,
            expected_delivery_date: item.expected_delivery_date,
            specification: item.notes,
            notes: item.notes
          }))
        };

        const created = await createPurchaseOrder(payload);
        if (!created?.data?.id) {
          throw new Error(t('purchaseOrderCreateFailed'));
        }

        navigate(`/purchases/${created.data.id}`);
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
        title={id === 'new' ? t('createPurchaseOrder') : `${t('order')} ${order?.po_number || id}`}
        subtitle="Manage supplier order creation, line items, and receipt coordination."
      />

      <PageCard>
        {loading ? (
          <div className="text-center py-10 text-gray-500">{t('loadingPurchases')}</div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm dark:bg-red-900/30 dark:border-red-800 dark:text-red-400">
            {error}
          </div>
        ) : id === 'new' ? (
          <form onSubmit={submit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">{t('vendor')}</label>
                <select
                  value={form.supplier_id}
                  onChange={(e) => setForm({ ...form, supplier_id: e.target.value })}
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
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">{t('expectedDelivery')}</label>
                <input
                  type="date"
                  value={form.expected_delivery_date}
                  onChange={(e) => setForm({ ...form, expected_delivery_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900 focus:outline-none focus:border-violet-500 dark:text-gray-150"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">{t('deliveryTerms')}</label>
                <input
                  value={form.delivery_terms}
                  onChange={(e) => setForm({ ...form, delivery_terms: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900 focus:outline-none focus:border-violet-500 dark:text-gray-150"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">{t('paymentTerms')}</label>
                <input
                  value={form.payment_terms}
                  onChange={(e) => setForm({ ...form, payment_terms: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900 focus:outline-none focus:border-violet-500 dark:text-gray-150"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">{t('budgetId')}</label>
                <input
                  type="number"
                  min="1"
                  value={form.budget_id}
                  onChange={(e) => setForm({ ...form, budget_id: e.target.value })}
                  placeholder={t('optionalBudgetId')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900 focus:outline-none focus:border-violet-500 dark:text-gray-150"
                />
              </div>
            </div>
 
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">{t('shippingAddress')}</label>
              <input
                value={form.shipping_address}
                onChange={(e) => setForm({ ...form, shipping_address: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900 focus:outline-none focus:border-violet-500 dark:text-gray-150"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">{t('notes')}</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900 focus:outline-none focus:border-violet-500 dark:text-gray-150"
              />
            </div>

            <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4 bg-gray-50 dark:bg-gray-900/40">
              <h3 className="font-semibold text-sm mb-4">{t('orderLines')}</h3>
              <div className="grid gap-4 md:grid-cols-5 mb-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">{t('selectProduct')}</label>
                  <select
                    value={lineForm.product_id}
                    onChange={(e) => setLineForm({ ...lineForm, product_id: e.target.value })}
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
                    value={lineForm.quantity}
                    onChange={(e) => setLineForm({ ...lineForm, quantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900 focus:outline-none focus:border-violet-500 dark:text-gray-150"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">{t('unitPrice')}</label>
                  <input
                    type="number"
                    min="0"
                    value={lineForm.unit_price}
                    onChange={(e) => setLineForm({ ...lineForm, unit_price: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900 focus:outline-none focus:border-violet-500 dark:text-gray-150"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">{t('unitOfMeasure')}</label>
                  <input
                    value={lineForm.unit_of_measure}
                    onChange={(e) => setLineForm({ ...lineForm, unit_of_measure: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900 focus:outline-none focus:border-violet-500 dark:text-gray-150"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={addLineItem}
                    className="w-full bg-violet-600 text-white py-2 rounded-lg hover:bg-violet-700"
                  >
                    {t('addLine')}
                  </button>
                </div>
              </div>

              {form.items.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm text-left text-gray-700 dark:text-gray-300">
                    <thead className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                      <tr>
                        <th className="px-3 py-2">{t('product')}</th>
                        <th className="px-3 py-2 text-right">{t('quantity')}</th>
                        <th className="px-3 py-2 text-right">{t('unitPrice')}</th>
                        <th className="px-3 py-2 text-right">{t('value')}</th>
                        <th className="px-3 py-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {form.items.map((item, index) => (
                        <tr key={`${item.product_id}-${index}`} className="border-b border-gray-200 dark:border-gray-800">
                          <td className="px-3 py-2">{item.product_name}</td>
                          <td className="px-3 py-2 text-right">{item.quantity}</td>
                          <td className="px-3 py-2 text-right">{item.unit_price.toFixed(2)}</td>
                          <td className="px-3 py-2 text-right">{(item.quantity * item.unit_price).toFixed(2)}</td>
                          <td className="px-3 py-2 text-right">
                            <button
                              type="button"
                              onClick={() => removeLineItem(index)}
                              className="text-red-600 hover:text-red-800 text-xs"
                            >
                              {t('remove')}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-sm text-gray-500">{t('noOrderLinesAdded')}</div>
              )}
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
                <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">{order?.supplier_name || '—'}</div>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200/50 dark:border-gray-800">
                <div className="text-[10px] uppercase font-bold tracking-wider text-gray-400 dark:text-gray-505 mb-1">{t('orderReference')}</div>
                <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">{order?.po_number || '—'}</div>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200/50 dark:border-gray-800">
                <div className="text-[10px] uppercase font-bold tracking-wider text-gray-400 dark:text-gray-505 mb-1">{t('state')}</div>
                <div className="mt-0.5">
                  <StateBadge state={order?.status || 'neutral'} label={order?.status || '—'} />
                </div>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200/50 dark:border-gray-800">
                <div className="text-[10px] uppercase font-bold tracking-wider text-gray-400 dark:text-gray-505 mb-1">{t('amount')}</div>
                <div className="text-sm font-bold text-violet-750 dark:text-violet-400">{order?.total_amount != null ? `${order.total_amount.toFixed(2)} ETB` : '—'}</div>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200/50 dark:border-gray-800">
                <div className="text-[10px] uppercase font-bold tracking-wider text-gray-400 dark:text-gray-505 mb-1">{t('budgetId')}</div>
                <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">{order?.budget_id || '—'}</div>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200/50 dark:border-gray-800">
                <div className="text-[10px] uppercase font-bold tracking-wider text-gray-400 dark:text-gray-505 mb-1">{t('budgetStatus') || 'Budget status'}</div>
                <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  {order?.budget_validated ? (t('budgetValidated') || 'Budget validated') : (t('budgetPending') || 'Budget pending')}
                </div>
                {order?.budget_validation_message && (
                  <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                    {order.budget_validation_message}
                  </div>
                )}
              </div>
            </div>
  
            <div className="flex flex-wrap gap-3 mt-4">
              {order?.status === 'draft' && (
                <>
                  {order?.budget_id && (
                    <button
                      type="button"
                      onClick={handleValidateOrderBudget}
                      disabled={loading}
                      className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded text-sm font-semibold disabled:opacity-50"
                    >
                      {t('validateBudget') || 'Validate Budget'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleSubmitOrder}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-semibold disabled:opacity-50"
                  >
                    {t('submitForApproval') || 'Submit for Approval'}
                  </button>
                </>
              )}
              {order?.status === 'pending' && (
                <button
                  type="button"
                  onClick={handleApproveOrder}
                  disabled={loading}
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded text-sm font-semibold disabled:opacity-50"
                >
                  {t('approvePurchaseOrder') || 'Approve Purchase Order'}
                </button>
              )}
              {order?.status === 'approved' && (
                <button
                  type="button"
                  onClick={handleSendOrder}
                  disabled={loading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-sm font-semibold disabled:opacity-50"
                >
                  {t('sendToSupplier') || 'Send to Supplier'}
                </button>
              )}
              {order?.status === 'sent' && (
                <button
                  type="button"
                  onClick={handleAcknowledgeOrder}
                  disabled={loading}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded text-sm font-semibold disabled:opacity-50"
                >
                  {t('acknowledgeSupplierReceipt') || 'Acknowledge Supplier Receipt'}
                </button>
              )}
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
                    {(order?.items || []).map((line) => (
                      <tr key={line.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-850/50">
                        <td className="py-2">{line.product_name || '—'}</td>
                        <td className="py-2 text-right font-mono">{line.quantity_ordered != null ? line.quantity_ordered : '—'}</td>
                        <td className="py-2 text-right font-mono">{line.unit_price != null ? `${line.unit_price.toFixed(2)} ETB` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {order?.status && ['approved', 'sent', 'supplier_acknowledged'].includes(order.status) && (
              <div className="rounded-lg border border-gray-200/50 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/40 p-4 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-wide font-semibold text-gray-500 dark:text-gray-400">{t('warehouseReceipt')}</div>
                    <div className="text-sm text-gray-700 dark:text-gray-300">{t('createReceiptFromPurchaseOrder')}</div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCreateReceipt}
                    disabled={receiptLoading}
                    className="btn-primary"
                  >
                    {receiptLoading ? t('creatingReceipt') : t('createReceipt')}
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">{t('deliveryLocation')}</label>
                    <input
                      type="text"
                      value={receiptLocation}
                      onChange={(e) => setReceiptLocation(e.target.value)}
                      placeholder={t('enterDeliveryLocation')}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900 focus:outline-none focus:border-violet-500 dark:text-gray-150"
                    />
                  </div>
                </div>
                {receiptMessage && (
                  <div className="text-sm text-green-700 dark:text-green-300">{receiptMessage}</div>
                )}
                {receiptError && (
                  <div className="text-sm text-red-700 dark:text-red-300">{receiptError}</div>
                )}
              </div>
            )}

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
