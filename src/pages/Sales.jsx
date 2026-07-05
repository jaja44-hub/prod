import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LangContext'
import { getOdooSalesOrders, getOdooSalesOrder, BACKEND_WAKEUP_MESSAGE } from '../services/ServiceGateway'
import ListFilterBar from '../components/ListFilterBar'

export default function Sales() {
  const { t } = useLang()
  const { currentUser, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({ search: '', state: '', dateFrom: '', dateTo: '' })
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const normalizeErrorMessage = (err) => {
    const raw = err?.response?.data?.error || err?.message || t('error')
    return raw === BACKEND_WAKEUP_MESSAGE ? t('backendWakingUp') : raw
  }

  useEffect(() => {
    let mounted = true

    async function loadSales(nextFilters) {
      setLoading(true)
      setError('')

      try {
        const result = await getOdooSalesOrders(50, {
          search: nextFilters.search || undefined,
          state: nextFilters.state || undefined,
          dateFrom: nextFilters.dateFrom || undefined,
          dateTo: nextFilters.dateTo || undefined,
        })

        if (!mounted) return
        setOrders(Array.isArray(result) ? result : [])
      } catch (err) {
        if (!mounted) return
        setError(normalizeErrorMessage(err))
      } finally {
        if (mounted) setLoading(false)
      }
    }

    if (authLoading || !currentUser) return
    loadSales(filters)

    return () => {
      mounted = false
    }
  }, [currentUser, authLoading, filters, t])

  async function handleViewOrder(orderItem) {
    if (detailLoading) return
    setDetailLoading(true)
    try {
      const detail = await getOdooSalesOrder(orderItem.id)
      setSelectedOrder(detail)
    } catch (err) {
      setError(normalizeErrorMessage(err))
    } finally {
      setDetailLoading(false)
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">{t('sales')}</h1>
      <p className="text-sm text-gray-600 mb-4">{t('salesOrdersDescription')}</p>
      <div className="bg-white dark:bg-gray-800 p-4 rounded shadow-sm">
        <ListFilterBar
          model="sale.order"
          value={filters}
          onChange={setFilters}
          onApply={() => setFilters((current) => ({ ...current }))}
          onClear={() => setFilters({ search: '', state: '', dateFrom: '', dateTo: '' })}
          fields={['search', 'state', 'dateRange']}
          stateOptions={[
            { value: 'draft', label: t('stateDraft') },
            { value: 'sent', label: t('stateSent') },
            { value: 'sale', label: t('stateSale') },
            { value: 'done', label: t('stateDone') },
            { value: 'cancel', label: t('stateCancel') },
          ]}
          loading={loading}
        />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
          <div />
          <button
            onClick={() => navigate('/sales/new')}
            className="px-3 py-1 bg-violet-600 text-white rounded"
          >
            {t('createSalesOrder')}
          </button>
        </div>

        {loading ? (
          <p className="text-gray-500">{t('loading')}</p>
        ) : error ? (
          <div className="space-y-3">
            <p className="text-red-500">{error}</p>
            <button
              onClick={() => {
                setLoading(true)
                setError('')
                getOdooSalesOrders(50, {
                  search: filters.search || undefined,
                  state: filters.state || undefined,
                  dateFrom: filters.dateFrom || undefined,
                  dateTo: filters.dateTo || undefined,
                })
                  .then((result) => setOrders(Array.isArray(result) ? result : []))
                  .catch((err) => setError(normalizeErrorMessage(err)))
                  .finally(() => setLoading(false))
              }}
              className="px-3 py-1 bg-violet-600 text-white rounded"
            >
              {t('retry')}
            </button>
          </div>
        ) : orders.length === 0 ? (
          <p className="text-gray-500">{t('noSalesOrdersForTenant')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm table-auto">
              <thead>
                <tr className="text-left text-gray-600 border-b">
                  <th className="py-2">{t('order')}</th>
                  <th className="py-2">{t('partner')}</th>
                  <th className="py-2">{t('amount')}</th>
                  <th className="py-2">{t('state')}</th>
                  <th className="py-2">{t('dateOrder')}</th>
                  <th className="py-2">{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b last:border-b-0">
                    <td className="py-2">{order.name || '—'}</td>
                    <td className="py-2">{order.partner_id?.[1] || '—'}</td>
                    <td className="py-2">{order.amount_total != null ? order.amount_total : '—'}</td>
                    <td className="py-2">{order.state || '—'}</td>
                    <td className="py-2">{order.date_order || '—'}</td>
                    <td className="py-2">
                      <button
                        onClick={() => handleViewOrder(order)}
                        disabled={detailLoading}
                        className="text-xs text-violet-600 font-semibold disabled:opacity-50"
                      >
                        {detailLoading ? t('loading') : t('viewOrder')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center justify-between mt-4">
              <div className="text-xs text-gray-500">{t('loadedOrders', { count: orders.length })}</div>
              <div>
                <span className="text-xs text-gray-500">{t('endOfResults')}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-6 relative">
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-lg font-bold"
            >
              ✕
            </button>
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
              {selectedOrder.name} - {t('salesOrderState') || 'Order Detail'}
            </h2>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <span className="text-xs text-gray-500 block">{t('customer')}</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {selectedOrder.partner_id?.[1] || '—'}
                </span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">{t('dateOrder')}</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {selectedOrder.date_order || '—'}
                </span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">{t('state')}</span>
                <span className="text-sm font-semibold capitalize text-gray-900 dark:text-white">
                  {selectedOrder.state || '—'}
                </span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">{t('amount')}</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  ${typeof selectedOrder.amount_total === 'number' ? selectedOrder.amount_total.toFixed(2) : '—'}
                </span>
              </div>
            </div>

            <h3 className="text-md font-bold mb-2 text-gray-950 dark:text-white">
              {t('orderLines')}
            </h3>
            <div className="border border-gray-200 dark:border-gray-700 rounded overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr className="text-left text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                    <th className="p-3">{t('product')}</th>
                    <th className="p-3 text-right">{t('quantity')}</th>
                    <th className="p-3 text-right">{t('unitPrice')}</th>
                    <th className="p-3 text-right">{t('value')}</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedOrder.order_lines || []).map((line) => {
                    const qty = line.product_uom_qty || 0;
                    const price = line.price_unit || 0;
                    const subtotal = qty * price;
                    return (
                      <tr key={line.id} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0 text-gray-900 dark:text-gray-100">
                        <td className="p-3">{line.product_id?.[1] || '—'}</td>
                        <td className="p-3 text-right">{qty}</td>
                        <td className="p-3 text-right">${price.toFixed(2)}</td>
                        <td className="p-3 text-right font-semibold">${subtotal.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                  {(!selectedOrder.order_lines || selectedOrder.order_lines.length === 0) && (
                    <tr>
                      <td colSpan="4" className="p-3 text-center text-gray-500">
                        No lines found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded text-sm font-semibold"
              >
                {t('clear') || 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
