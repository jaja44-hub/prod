import React, { useEffect, useState } from 'react'
import { useLang } from '../context/LangContext'
import { getOdooPurchaseOrders, BACKEND_WAKEUP_MESSAGE } from '../services/ServiceGateway'

export default function PurchaseOrders() {
  const { t } = useLang()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [queryText, setQueryText] = useState('')

  const normalizeErrorMessage = (err) => {
    const raw = err?.response?.data?.error || err?.message || t('error')
    return raw === BACKEND_WAKEUP_MESSAGE ? t('backendWakingUp') : raw
  }

  useEffect(() => {
    let mounted = true

    async function loadOrders() {
      setLoading(true)
      setError('')
      try {
        const result = await getOdooPurchaseOrders(50)
        if (!mounted) return
        setOrders(Array.isArray(result) ? result : [])
      } catch (err) {
        if (!mounted) return
        setError(normalizeErrorMessage(err))
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadOrders()
    return () => { mounted = false }
  }, [t])

  const filtered = orders.filter((order) => {
    if (!queryText) return true
    const q = queryText.toLowerCase()
    return (
      (order.name || '').toLowerCase().includes(q) ||
      (order.partner_id?.[1] || '').toLowerCase().includes(q) ||
      (order.state || '').toLowerCase().includes(q)
    )
  })

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">{t('purchaseOrders')}</h1>
      <p className="text-sm text-gray-600 mb-4">{t('purchaseOrdersDescription')}</p>
      <div className="bg-white dark:bg-gray-800 p-4 rounded shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <input
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              placeholder={`${t('search')} ${t('purchaseOrders')}`}
              className="px-3 py-1 rounded border"
            />
            <button onClick={() => setQueryText('')} className="text-xs text-gray-500">
              {t('clear')}
            </button>
          </div>
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
                getOdooPurchaseOrders(50)
                  .then((result) => setOrders(Array.isArray(result) ? result : []))
                  .catch((err) => setError(normalizeErrorMessage(err)))
                  .finally(() => setLoading(false))
              }}
              className="px-3 py-1 bg-violet-600 text-white rounded"
            >
              {t('retry')}
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-gray-500">{t('noResults')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm table-auto">
              <thead>
                <tr className="text-left text-gray-600 border-b">
                  <th className="py-2">{t('order')}</th>
                  <th className="py-2">{t('partner')}</th>
                  <th className="py-2">{t('dateOrder')}</th>
                  <th className="py-2">{t('amount')}</th>
                  <th className="py-2">{t('state')}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => (
                  <tr key={order.id} className="border-b last:border-b-0">
                    <td className="py-2">{order.name || '—'}</td>
                    <td className="py-2">{order.partner_id?.[1] || '—'}</td>
                    <td className="py-2">{order.date_order || '—'}</td>
                    <td className="py-2">{order.amount_total != null ? order.amount_total : '—'}</td>
                    <td className="py-2">{order.state || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
