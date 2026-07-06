import React, { useEffect, useState } from 'react'
import { useLang } from '../context/LangContext'
import { getOdooManufacturingOrders, BACKEND_WAKEUP_MESSAGE } from '../services/ServiceGateway'
import ListFilterBar from '../components/ListFilterBar'

export default function WorkOrders() {
  const { t } = useLang()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({ state: '' })
  const [viewMode, setViewMode] = useState('list') // 'list' or 'kanban'

  const normalizeErrorMessage = (err) => {
    const raw = err?.response?.data?.error || err?.message || t('error')
    return raw === BACKEND_WAKEUP_MESSAGE ? t('backendWakingUp') : raw
  }

  const loadOrders = async (currentFilters) => {
    setLoading(true)
    setError('')
    try {
      const result = await getOdooManufacturingOrders(50, { state: currentFilters.state || undefined })
      setOrders(Array.isArray(result) ? result : [])
    } catch (err) {
      const message = err?.response?.data?.error || err?.message || 'Failed to load manufacturing orders.'
      if (message.toLowerCase().includes('mrp.production') || message.toLowerCase().includes('manufacturing module')) {
        setError(t('manufacturingModuleInactive'))
      } else {
        setError(message === BACKEND_WAKEUP_MESSAGE ? t('backendWakingUp') : message)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders(filters)
  }, [filters, t])

  const stateColumns = ['draft', 'confirmed', 'progress', 'done', 'cancel']

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-semibold mb-1">{t('manufacturingOrders')} - Shop Floor</h1>
          <p className="text-sm text-gray-600">{t('manufacturingOrdersDescription')}</p>
        </div>
        <div className="flex bg-gray-100 dark:bg-gray-700 rounded overflow-hidden">
          <button onClick={() => setViewMode('list')} className={`px-3 py-1 text-sm \${viewMode === 'list' ? 'bg-violet-600 text-white' : 'text-gray-600 dark:text-gray-200'}`}>List</button>
          <button onClick={() => setViewMode('kanban')} className={`px-3 py-1 text-sm \${viewMode === 'kanban' ? 'bg-violet-600 text-white' : 'text-gray-600 dark:text-gray-200'}`}>Kanban</button>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 p-4 rounded shadow-sm">
        <ListFilterBar
          model="mrp.production"
          value={filters}
          onChange={setFilters}
          onApply={() => loadOrders(filters)}
          onClear={() => { setFilters({ state: '' }); loadOrders({ state: '' }); }}
          fields={['state']}
          loading={loading}
        />

        {loading ? (
          <p className="text-gray-500">{t('loading')}</p>
        ) : error ? (
          <div className="space-y-3">
            <p className="text-red-500">{error}</p>
            <button onClick={() => loadOrders(filters)} className="px-3 py-1 bg-violet-600 text-white rounded">{t('retry')}</button>
          </div>
        ) : orders.length === 0 ? (
          <p className="text-gray-500">{t('noResults')}</p>
        ) : viewMode === 'list' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm table-auto">
              <thead>
                <tr className="text-left text-gray-600 border-b dark:border-gray-700">
                  <th className="py-2">{t('order')}</th>
                  <th className="py-2">{t('product')}</th>
                  <th className="py-2">{t('quantity')}</th>
                  <th className="py-2">{t('state')}</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b last:border-b-0 dark:border-gray-700">
                    <td className="py-2 font-medium">{order.name || '—'}</td>
                    <td className="py-2">{order.product_id?.[1] || '—'}</td>
                    <td className="py-2">{order.product_qty ?? '—'}</td>
                    <td className="py-2">
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs capitalize">{order.state || '—'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {stateColumns.map(col => (
              <div key={col} className="w-72 flex-shrink-0 bg-gray-50 dark:bg-gray-900 rounded-md p-3">
                <h3 className="font-bold text-gray-700 dark:text-gray-300 capitalize mb-3 px-1">{col}</h3>
                <div className="space-y-3">
                  {orders.filter(o => (o.state || 'draft') === col).map(order => (
                    <div key={order.id} className="bg-white dark:bg-gray-800 p-3 rounded shadow-sm border border-gray-100 dark:border-gray-700">
                      <div className="font-bold text-sm text-violet-700 dark:text-violet-400">{order.name}</div>
                      <div className="text-sm mt-1">{order.product_id?.[1]}</div>
                      <div className="text-xs text-gray-500 mt-2">Qty: {order.product_qty}</div>
                    </div>
                  ))}
                  {orders.filter(o => (o.state || 'draft') === col).length === 0 && (
                    <div className="text-xs text-gray-400 italic px-1">No orders</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
