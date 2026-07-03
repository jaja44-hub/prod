import React, { useEffect, useState } from 'react'
import { useLang } from '../context/LangContext'
import { useAuth } from '../context/AuthContext'
import { getOdooAccounts, BACKEND_WAKEUP_MESSAGE } from '../services/ServiceGateway'
import ListFilterBar from '../components/ListFilterBar'

export default function Accounts() {
  const { t } = useLang()
  const { currentUser, loading: authLoading } = useAuth()
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({ search: '', accountType: '', active: true })

  const normalizeErrorMessage = (err) => {
    const raw = err?.response?.data?.error || err?.message || t('error')
    return raw === BACKEND_WAKEUP_MESSAGE ? t('backendWakingUp') : raw
  }

  useEffect(() => {
    let mounted = true

    async function loadAccounts(nextFilters) {
      setLoading(true)
      setError('')
      try {
        const result = await getOdooAccounts(100, {
          search: nextFilters.search || undefined,
          account_type: nextFilters.accountType || undefined,
          active: nextFilters.active,
        })
        if (!mounted) return
        setAccounts(Array.isArray(result) ? result : [])
      } catch (err) {
        if (!mounted) return
        setError(normalizeErrorMessage(err))
      } finally {
        if (mounted) setLoading(false)
      }
    }

    if (authLoading || !currentUser) return
    loadAccounts(filters)
    return () => { mounted = false }
  }, [currentUser, authLoading, filters, t])

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">{t('finance')}</h1>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{t('financeDescription')}</p>
      <div className="bg-white dark:bg-gray-800 p-4 rounded shadow-sm">
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

        {loading ? (
          <p className="text-gray-500">{t('loadingFinance')}</p>
        ) : error ? (
          <div className="space-y-3">
            <p className="text-red-500">{error}</p>
            <button
              type="button"
              onClick={() => {
                setLoading(true)
                setError('')
                getOdooAccounts(100, {
                  search: filters.search || undefined,
                  account_type: filters.accountType || undefined,
                  active: filters.active,
                })
                  .then((result) => setAccounts(Array.isArray(result) ? result : []))
                  .catch((err) => setError(normalizeErrorMessage(err)))
                  .finally(() => setLoading(false))
              }}
              className="px-3 py-1 bg-violet-600 text-white rounded"
            >
              {t('retry')}
            </button>
          </div>
        ) : accounts.length === 0 ? (
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
        )}
      </div>
    </div>
  )
}
