import React, { useEffect, useState } from 'react'
import { useLang } from '../context/LangContext'
import { useAuth } from '../context/AuthContext'
import {
  getOdooAccounts,
  getOdooJournals,
  getOdooPayments,
  BACKEND_WAKEUP_MESSAGE
} from '../services/ServiceGateway'
import ListFilterBar from '../components/ListFilterBar'

export default function Accounts() {
  const { t } = useLang()
  const { currentUser, loading: authLoading, tenantConfig } = useAuth()
  const isET = tenantConfig?.complianceProfile === 'ethiopia_primary'
  const [activeTab, setActiveTab] = useState('accounts') // 'accounts', 'journals', 'payments'
  const [accounts, setAccounts] = useState([])
  const [journals, setJournals] = useState([])
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({ search: '', accountType: '', active: true })

  const normalizeErrorMessage = (err) => {
    const raw = err?.response?.data?.error || err?.message || t('error')
    return raw === BACKEND_WAKEUP_MESSAGE ? t('backendWakingUp') : raw
  }

  useEffect(() => {
    let mounted = true

    async function loadData() {
      setLoading(true)
      setError('')
      try {
        if (activeTab === 'accounts') {
          const result = await getOdooAccounts(100, {
            search: filters.search || undefined,
            account_type: filters.accountType || undefined,
            active: filters.active,
          })
          if (mounted) setAccounts(Array.isArray(result) ? result : [])
        } else if (activeTab === 'journals') {
          const result = await getOdooJournals(100)
          if (mounted) setJournals(Array.isArray(result) ? result : [])
        } else if (activeTab === 'payments') {
          const result = await getOdooPayments(100)
          let loadedPayments = Array.isArray(result) ? result : []
          if (isET) {
            const { calculateEthiopianTaxes } = await import('../lib/oracles/settlementOracle')
            loadedPayments = await Promise.all(loadedPayments.map(async (p) => {
               const taxData = await calculateEthiopianTaxes(p.amount || 0, true)
               return { ...p, taxData }
            }))
          }
          if (mounted) setPayments(loadedPayments)
        }
      } catch (err) {
        if (mounted) setError(normalizeErrorMessage(err))
      } finally {
        if (mounted) setLoading(false)
      }
    }

    if (authLoading || !currentUser) return
    loadData()
    return () => { mounted = false }
  }, [currentUser, authLoading, activeTab, filters])

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">{t('finance')}</h1>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{t('financeDescription')}</p>
      <div className="bg-white dark:bg-gray-800 p-4 rounded shadow-sm">
        {/* Multi-tab layout header */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
          <button
            onClick={() => {
              setActiveTab('accounts')
              setFilters({ search: '', accountType: '', active: true })
            }}
            className={`py-2 px-4 font-semibold text-sm transition-colors duration-150 ${
              activeTab === 'accounts'
                ? 'border-b-2 border-violet-600 text-violet-600 dark:text-violet-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            {t('chartOfAccounts') || 'Chart of Accounts'}
          </button>
          <button
            onClick={() => setActiveTab('journals')}
            className={`py-2 px-4 font-semibold text-sm transition-colors duration-150 ${
              activeTab === 'journals'
                ? 'border-b-2 border-violet-600 text-violet-600 dark:text-violet-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            {t('journals') || 'Journals'}
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`py-2 px-4 font-semibold text-sm transition-colors duration-150 ${
              activeTab === 'payments'
                ? 'border-b-2 border-violet-600 text-violet-600 dark:text-violet-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            {t('payments') || 'Payments'}
          </button>
        </div>

        {/* Search / Filters - Only shown for Chart of Accounts to avoid complexity */}
        {activeTab === 'accounts' && (
          <ListFilterBar
            model="account.account"
            value={filters}
            onChange={setFilters}
            onApply={() => setFilters((current) => ({ ...current }))}
            onClear={() => setFilters({ search: '', accountType: '', active: true })}
            fields={['search', 'accountType', 'active']}
            accountTypeOptions={[
              { value: 'asset_receivable', label: t('accountTypeReceivable') },
              { value: 'asset_cash', label: t('accountTypeCash') },
              { value: 'asset_current', label: t('accountTypeCurrentAsset') },
              { value: 'liability_payable', label: t('accountTypePayable') },
              { value: 'liability_credit_card', label: t('accountTypeCreditCard') },
              { value: 'equity', label: t('accountTypeEquity') },
              { value: 'income', label: t('accountTypeIncome') },
              { value: 'expense', label: t('accountTypeExpense') },
            ]}
            loading={loading}
          />
        )}

        {loading ? (
          <p className="text-gray-500">{t('loadingFinance') || 'Loading...'}</p>
        ) : error ? (
          <div className="space-y-3">
            <p className="text-red-500">{error}</p>
            <button
              type="button"
              onClick={() => {
                setFilters((current) => ({ ...current }))
              }}
              className="px-3 py-1 bg-violet-600 text-white rounded"
            >
              {t('retry')}
            </button>
          </div>
        ) : activeTab === 'accounts' ? (
          accounts.length === 0 ? (
            <p className="text-gray-500">{t('noAccountsForTenant')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm table-auto">
                <thead>
                  <tr className="text-left text-gray-600 dark:text-gray-400 border-b dark:border-gray-700">
                    <th className="py-2">{t('code')}</th>
                    <th className="py-2">{t('accounts')}</th>
                    <th className="py-2">{t('accountType')}</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((account) => (
                    <tr key={account.id} className="border-b dark:border-gray-700">
                      <td className="py-2">{account.code || '—'}</td>
                      <td className="py-2">{account.name || '—'}</td>
                      <td className="py-2">{account.account_type || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex items-center justify-between mt-4">
                <div className="text-xs text-gray-500">{t('loadedAccounts', { count: accounts.length })}</div>
                <div>
                  <span className="text-xs text-gray-500">{t('endOfResults')}</span>
                </div>
              </div>
            </div>
          )
        ) : activeTab === 'journals' ? (
          journals.length === 0 ? (
            <p className="text-gray-500">No journals found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm table-auto">
                <thead>
                  <tr className="text-left text-gray-600 dark:text-gray-400 border-b dark:border-gray-700">
                    <th className="py-2">{t('name') || 'Name'}</th>
                    <th className="py-2">{t('code') || 'Code'}</th>
                    <th className="py-2">{t('type') || 'Type'}</th>
                  </tr>
                </thead>
                <tbody>
                  {journals.map((journal) => (
                    <tr key={journal.id} className="border-b dark:border-gray-700">
                      <td className="py-2">{journal.name || '—'}</td>
                      <td className="py-2">{journal.code || '—'}</td>
                      <td className="py-2 capitalize">{journal.type || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : activeTab === 'payments' ? (
          payments.length === 0 ? (
            <p className="text-gray-500">No payments found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm table-auto">
                <thead>
                  <tr className="text-left text-gray-600 dark:text-gray-400 border-b dark:border-gray-700">
                    <th className="py-2">{t('name') || 'Name'}</th>
                    <th className="py-2">{t('date') || 'Date'}</th>
                    <th className="py-2">{t('paymentType') || 'Payment Type'}</th>
                    <th className="py-2">{t('amount') || 'Amount'}</th>
                    {isET && <th className="py-2 text-violet-600 dark:text-violet-400">VAT (15%)</th>}
                    {isET && <th className="py-2 text-violet-600 dark:text-violet-400">WHT (2%)</th>}
                    <th className="py-2">{t('partner') || 'Partner'}</th>
                    <th className="py-2">{t('state') || 'State'}</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id} className="border-b dark:border-gray-700">
                      <td className="py-2">{payment.name || '—'}</td>
                      <td className="py-2">{payment.date || '—'}</td>
                      <td className="py-2 capitalize">{payment.payment_type ? payment.payment_type.replace('_', ' ') : '—'}</td>
                      <td className="py-2">${typeof payment.amount === 'number' ? payment.amount.toFixed(2) : '—'}</td>
                      {isET && <td className="py-2 text-violet-600 dark:text-violet-400 font-mono">${payment.taxData?.vatAmount?.toFixed(2) || '0.00'}</td>}
                      {isET && <td className="py-2 text-violet-600 dark:text-violet-400 font-mono">${payment.taxData?.whtAmount?.toFixed(2) || '0.00'}</td>}
                      <td className="py-2">{payment.partner_id?.[1] || '—'}</td>
                      <td className="py-2">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                            payment.state === 'posted'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : payment.state === 'draft'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {payment.state || '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : null}
      </div>
    </div>
  )
}
