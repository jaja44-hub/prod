import React, { useEffect, useState } from 'react'
import { useLang } from '../context/LangContext'
import { getOdooCustomers, getOdooVendors } from '../services/ServiceGateway'

export default function Customers() {
  const { t } = useLang()
  const [activeTab, setActiveTab] = useState('customers')
  const [customers, setCustomers] = useState([])
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [queryText, setQueryText] = useState('')

  useEffect(() => {
    let mounted = true

    async function loadContacts() {
      setLoading(true)
      setError('')
      try {
        const [customerResult, vendorResult] = await Promise.all([
          getOdooCustomers(50),
          getOdooVendors(50),
        ])
        if (!mounted) return
        setCustomers(Array.isArray(customerResult) ? customerResult : [])
        setVendors(Array.isArray(vendorResult) ? vendorResult : [])
      } catch (err) {
        if (!mounted) return
        setError(err?.response?.data?.error || err?.message || t('error'))
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadContacts()
    return () => { mounted = false }
  }, [t])

  const activeList = activeTab === 'vendors' ? vendors : customers
  const filtered = activeList.filter((item) => {
    if (!queryText) return true
    const q = queryText.toLowerCase()
    return (
      (item.name || '').toLowerCase().includes(q) ||
      (item.email || '').toLowerCase().includes(q) ||
      (item.phone || '').toLowerCase().includes(q) ||
      (item.city || '').toLowerCase().includes(q)
    )
  })

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">{t('crm')}</h1>
      <p className="text-sm text-gray-600 mb-4">{t('crmDescription')}</p>
      <div className="bg-white dark:bg-gray-800 p-4 rounded shadow-sm">
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('customers')}
            className={`px-3 py-2 rounded ${activeTab === 'customers' ? 'bg-violet-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
          >
            {t('customerTab')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('vendors')}
            className={`px-3 py-2 rounded ${activeTab === 'vendors' ? 'bg-violet-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
          >
            {t('vendorTab')}
          </button>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <input
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              placeholder={`${t('search')} ${activeTab === 'vendors' ? t('vendors') : t('customers')}`}
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
                Promise.all([getOdooCustomers(50), getOdooVendors(50)])
                  .then(([customerResult, vendorResult]) => {
                    setCustomers(Array.isArray(customerResult) ? customerResult : [])
                    setVendors(Array.isArray(vendorResult) ? vendorResult : [])
                  })
                  .catch((err) => setError(err?.response?.data?.error || err?.message || t('error')))
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
                  <th className="py-2">{t('name')}</th>
                  <th className="py-2">{t('email')}</th>
                  <th className="py-2">{t('phone')}</th>
                  <th className="py-2">{t('city')}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id} className="border-b last:border-b-0">
                    <td className="py-2">{item.name || '—'}</td>
                    <td className="py-2">{item.email || '—'}</td>
                    <td className="py-2">{item.phone || '—'}</td>
                    <td className="py-2">{item.city || '—'}</td>
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
