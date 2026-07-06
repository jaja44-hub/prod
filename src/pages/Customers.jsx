import React, { useEffect, useState } from 'react'
import { useLang } from '../context/LangContext'
import { getOdooCustomers, getOdooVendors, BACKEND_WAKEUP_MESSAGE } from '../services/ServiceGateway'
import ListFilterBar from '../components/ListFilterBar'

export default function Customers() {
  const { t } = useLang()
  const [activeTab, setActiveTab] = useState('customers') // customers, vendors, delivery
  const [customers, setCustomers] = useState([])
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({ search: '' })

  // Mock Logistics Delivery Terms Config
  const [deliveryTerms] = useState([
    { id: 1, name: 'FOB - Free on Board', description: 'Seller pays for transportation of the goods to the port of shipment.', default: false },
    { id: 2, name: 'EXW - Ex Works', description: 'Seller makes goods available at their premises.', default: true },
    { id: 3, name: 'DDP - Delivered Duty Paid', description: 'Seller is responsible for delivering the goods to the named place in the country of the buyer.', default: false },
  ])

  const normalizeErrorMessage = (err) => {
    const raw = err?.response?.data?.error || err?.message || t('error')
    return raw === BACKEND_WAKEUP_MESSAGE ? t('backendWakingUp') : raw
  }

  const loadData = async (currentFilters) => {
    setLoading(true)
    setError('')
    try {
      if (activeTab === 'customers') {
        const res = await getOdooCustomers(50, { search: currentFilters.search || undefined })
        setCustomers(Array.isArray(res) ? res : [])
      } else if (activeTab === 'vendors') {
        const res = await getOdooVendors(50, { search: currentFilters.search || undefined })
        setVendors(Array.isArray(res) ? res : [])
      }
    } catch (err) {
      setError(normalizeErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab !== 'delivery') {
      loadData(filters)
    }
  }, [activeTab, filters])

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">{t('crm')} & Logistics</h1>
      <p className="text-sm text-gray-600 mb-4">{t('crmDescription')}</p>
      
      <div className="bg-white dark:bg-gray-800 p-4 rounded shadow-sm">
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
          <button
            onClick={() => { setActiveTab('customers'); setFilters({ search: '' }); }}
            className={`py-2 px-4 font-semibold text-sm transition-colors \${activeTab === 'customers' ? 'border-b-2 border-violet-600 text-violet-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {t('customerTab')}
          </button>
          <button
            onClick={() => { setActiveTab('vendors'); setFilters({ search: '' }); }}
            className={`py-2 px-4 font-semibold text-sm transition-colors \${activeTab === 'vendors' ? 'border-b-2 border-violet-600 text-violet-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {t('vendorTab')}
          </button>
          <button
            onClick={() => setActiveTab('delivery')}
            className={`py-2 px-4 font-semibold text-sm transition-colors \${activeTab === 'delivery' ? 'border-b-2 border-violet-600 text-violet-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Delivery Terms
          </button>
        </div>

        {activeTab !== 'delivery' && (
          <ListFilterBar
            model="res.partner"
            value={filters}
            onChange={setFilters}
            onApply={() => loadData(filters)}
            onClear={() => { setFilters({ search: '' }); loadData({ search: '' }); }}
            fields={['search']}
            loading={loading}
          />
        )}

        {loading && activeTab !== 'delivery' ? (
          <p className="text-gray-500">{t('loading')}</p>
        ) : error ? (
          <div className="space-y-3">
            <p className="text-red-500">{error}</p>
            <button onClick={() => loadData(filters)} className="px-3 py-1 bg-violet-600 text-white rounded">{t('retry')}</button>
          </div>
        ) : activeTab === 'delivery' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm table-auto">
              <thead>
                <tr className="text-left text-gray-600 border-b dark:border-gray-700">
                  <th className="py-2">Term Code</th>
                  <th className="py-2">Description</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {deliveryTerms.map((term) => (
                  <tr key={term.id} className="border-b last:border-b-0 dark:border-gray-700">
                    <td className="py-2 font-semibold">{term.name}</td>
                    <td className="py-2">{term.description}</td>
                    <td className="py-2">
                      {term.default ? <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Default</span> : <span className="text-gray-400">Optional</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm table-auto">
              <thead>
                <tr className="text-left text-gray-600 border-b dark:border-gray-700">
                  <th className="py-2">{t('name')}</th>
                  <th className="py-2">{t('email')}</th>
                  <th className="py-2">{t('phone')}</th>
                  <th className="py-2">{t('city')}</th>
                </tr>
              </thead>
              <tbody>
                {(activeTab === 'customers' ? customers : vendors).map((item) => (
                  <tr key={item.id} className="border-b last:border-b-0 dark:border-gray-700">
                    <td className="py-2 font-semibold text-gray-900 dark:text-gray-100">{item.name || '—'}</td>
                    <td className="py-2 text-gray-600 dark:text-gray-400">{item.email || '—'}</td>
                    <td className="py-2 text-gray-600 dark:text-gray-400">{item.phone || '—'}</td>
                    <td className="py-2 text-gray-600 dark:text-gray-400">{item.city || '—'}</td>
                  </tr>
                ))}
                {(activeTab === 'customers' ? customers : vendors).length === 0 && (
                   <tr><td colSpan="4" className="py-4 text-center text-gray-500">{t('noResults')}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
