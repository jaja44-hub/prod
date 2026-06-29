import React, { useEffect, useState } from 'react';
import { useLang } from '../context/LangContext';
import { getOdooAccounts, BACKEND_WAKEUP_MESSAGE } from '../services/ServiceGateway';

export default function Accounts() {
  const { t } = useLang();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [queryText, setQueryText] = useState('');

  const normalizeErrorMessage = (err) => {
    const raw = err?.response?.data?.error || err?.message || t('error');
    return raw === BACKEND_WAKEUP_MESSAGE ? t('backendWakingUp') : raw;
  };

  useEffect(() => {
    let mounted = true;

    async function loadAccounts() {
      setLoading(true);
      setError('');
      try {
        const result = await getOdooAccounts(100);
        if (!mounted) return;
        setAccounts(Array.isArray(result) ? result : []);
      } catch (err) {
        if (!mounted) return;
        setError(normalizeErrorMessage(err));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadAccounts();
    return () => { mounted = false; };
  }, [t]);

  const filtered = accounts.filter((account) => {
    if (!queryText) return true;
    const q = queryText.toLowerCase();
    return (
      (account.code || '').toLowerCase().includes(q) ||
      (account.name || '').toLowerCase().includes(q) ||
      (account.account_type || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">{t('finance')}</h1>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{t('financeDescription')}</p>
      <div className="bg-white dark:bg-gray-800 p-4 rounded shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <input
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              placeholder={`${t('search')} ${t('accounts')}`}
              className="px-3 py-1 rounded border dark:bg-gray-900 dark:border-gray-700"
            />
            <button type="button" onClick={() => setQueryText('')} className="text-xs text-gray-500">
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
              type="button"
              onClick={() => {
                setLoading(true);
                setError('');
                getOdooAccounts(100)
                  .then((result) => setAccounts(Array.isArray(result) ? result : []))
                  .catch((err) => setError(normalizeErrorMessage(err)))
                  .finally(() => setLoading(false));
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
                <tr className="text-left text-gray-600 dark:text-gray-400 border-b dark:border-gray-700">
                  <th className="py-2">{t('code')}</th>
                  <th className="py-2">{t('accounts')}</th>
                  <th className="py-2">{t('accountType')}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((account) => (
                  <tr key={account.id} className="border-b dark:border-gray-700">
                    <td className="py-2">{account.code}</td>
                    <td className="py-2">{account.name}</td>
                    <td className="py-2">{account.account_type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
