import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLang } from '../context/LangContext'
import { useAuth } from '../context/AuthContext'
import {
  getOdooSalesOrder,
  createOdooSalesOrder,
  getOdooCustomers,
  getOdooProducts,
  logAuditEvent,
  BACKEND_WAKEUP_MESSAGE,
} from '../services/ServiceGateway'

export default function SalesOrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useLang()
  const { currentUser, userProfile, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [order, setOrder] = useState(null)
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  const [form, setForm] = useState({
    partner_id: '',
    origin: '',
    product_id: '',
    quantity: 1,
    unitPrice: 0,
  })

  const normalizeErrorMessage = (err) => {
    const raw = err?.response?.data?.error || err?.message || t('error')
    return raw === BACKEND_WAKEUP_MESSAGE ? t('backendWakingUp') : raw
  }

  useEffect(() => {
    let mounted = true

    async function load() {
      setLoading(true)
      setError('')

      try {
        const [customerResult, productResult] = await Promise.all([
          getOdooCustomers(50),
          getOdooProducts(50),
        ])

        if (!mounted) return
        setCustomers(Array.isArray(customerResult) ? customerResult : [])
        setProducts(Array.isArray(productResult) ? productResult : [])

        if (id && id !== 'new') {
          const existingOrder = await getOdooSalesOrder(id)
          if (!mounted) return
          setOrder(existingOrder)
          setForm({
            partner_id: existingOrder?.partner_id?.[0] || '',
            origin: existingOrder?.origin || '',
            product_id: existingOrder?.order_lines?.[0]?.product_id?.[0] || '',
            quantity: existingOrder?.order_lines?.[0]?.product_uom_qty || 1,
            unitPrice: existingOrder?.order_lines?.[0]?.price_unit || 0,
          })
        }
      } catch (err) {
        if (!mounted) return
        setError(normalizeErrorMessage(err))
      } finally {
        if (mounted) setLoading(false)
      }
    }

    if (authLoading || !currentUser) return
    load()
    return () => { mounted = false }
  }, [id, authLoading, currentUser, t])

  useEffect(() => {
    if (!form.product_id || products.length === 0) return
    const selectedProduct = products.find((product) => Number(product.id) === Number(form.product_id))
    if (selectedProduct) {
      setForm((prev) => ({ ...prev, unitPrice: selectedProduct.list_price || prev.unitPrice }))
    }
  }, [form.product_id, products])

  async function submit(event) {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (id === 'new') {
        const created = await createOdooSalesOrder({
          partner_id: form.partner_id,
          origin: form.origin,
          lines: [
            {
              product_id: form.product_id,
              quantity: form.quantity,
              unitPrice: form.unitPrice,
            },
          ],
        })

        if (!created?.id) {
          throw new Error('Failed to create sales order in Odoo.')
        }

        try {
          await logAuditEvent({
            type: 'sale_order.create',
            orderId: created.id,
            orderName: created.name,
            actor: userProfile?.name || userProfile?.email || currentUser?.uid || 'unknown',
            tenant: currentUser?.uid,
            details: {
              partner_id: created.partner_id?.[0],
              lineCount: created.order_lines?.length || 0,
            },
          })
        } catch {
          // Audit failures must not block save.
        }

        navigate(`/sales/${created.id}`)
        return
      }
    } catch (err) {
      setError(normalizeErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <div className="bg-white dark:bg-gray-800 p-4 rounded shadow-sm max-w-3xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            {id === 'new' ? t('createSalesOrder') : `${t('order')} ${order?.name || id}`}
          </h2>
          <button onClick={() => navigate('/sales')} className="text-sm text-gray-500">
            {t('back')}
          </button>
        </div>

        {loading ? (
          <p>{t('loadingSales')}</p>
        ) : error ? (
          <div className="space-y-3">
            <p className="text-red-500">{error}</p>
          </div>
        ) : id === 'new' ? (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">{t('customer')}</label>
              <select
                value={form.partner_id}
                onChange={(e) => setForm({ ...form, partner_id: e.target.value })}
                className="w-full p-2 border rounded"
              >
                <option value="">{t('selectCustomer')}</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">{t('orderReference')}</label>
              <input
                value={form.origin}
                onChange={(e) => setForm({ ...form, origin: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">{t('selectProduct')}</label>
              <select
                value={form.product_id}
                onChange={(e) => setForm({ ...form, product_id: e.target.value })}
                className="w-full p-2 border rounded"
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
              <label className="block text-xs text-gray-600 mb-1">{t('quantity')}</label>
              <input
                type="number"
                min="1"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
                className="w-full p-2 border rounded"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">{t('unitPrice')}</label>
              <input
                type="number"
                min="0"
                value={form.unitPrice}
                onChange={(e) => setForm({ ...form, unitPrice: Number(e.target.value) })}
                className="w-full p-2 border rounded"
              />
            </div>

            <div className="flex justify-between items-center">
              <button type="button" onClick={() => navigate('/sales')} className="px-3 py-1 border rounded">
                {t('cancel')}
              </button>
              <button type="submit" className="px-3 py-1 bg-violet-600 text-white rounded">
                {t('save')}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded">
                <div className="text-xs text-gray-500 mb-1">{t('customer')}</div>
                <div>{order?.partner_id?.[1] || '—'}</div>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded">
                <div className="text-xs text-gray-500 mb-1">{t('orderReference')}</div>
                <div>{order?.origin || '—'}</div>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded">
                <div className="text-xs text-gray-500 mb-1">{t('state')}</div>
                <div>{order?.state || '—'}</div>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded">
                <div className="text-xs text-gray-500 mb-1">{t('amount')}</div>
                <div>{order?.amount_total != null ? order.amount_total : '—'}</div>
              </div>
            </div>

            <div>
              <div className="text-sm font-semibold mb-2">{t('orderLines')}</div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm table-auto">
                  <thead>
                    <tr className="text-left text-gray-600 border-b">
                      <th className="py-2">{t('product')}</th>
                      <th className="py-2">{t('quantity')}</th>
                      <th className="py-2">{t('unitPrice')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(order?.order_lines || []).map((line) => (
                      <tr key={line.id} className="border-b last:border-b-0">
                        <td className="py-2">{line.product_id?.[1] || '—'}</td>
                        <td className="py-2">{line.product_uom_qty != null ? line.product_uom_qty : '—'}</td>
                        <td className="py-2">{line.price_unit != null ? line.price_unit : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
