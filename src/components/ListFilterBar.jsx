import React, { useEffect, useState } from 'react';
import { useLang } from '../context/LangContext';

export default function ListFilterBar({
  model,
  value = {},
  onChange,
  onApply,
  onClear,
  fields = [],
  stateOptions = [],
  accountTypeOptions = [],
  loading = false,
}) {
  const { t } = useLang();
  const [searchValue, setSearchValue] = useState(value.search || '');

  useEffect(() => {
    setSearchValue(value.search || '');
  }, [value.search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const currentSearch = value.search || '';
      if (searchValue !== currentSearch) {
        onChange({ ...value, search: searchValue });
        onApply();
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchValue, value, onChange, onApply]);

  const handleUpdate = (key, nextValue) => {
    onChange({ ...value, [key]: nextValue });
  };

  const handleClear = () => {
    setSearchValue('');
    onClear();
  };

  return (
    <div className="mb-4 p-4 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {fields.includes('search') && (
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">{t('filterSearch')}</label>
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder={t('search')}
              className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
            />
          </div>
        )}

        {fields.includes('state') && (
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">{t('filterState')}</label>
            <select
              value={value.state || ''}
              onChange={(e) => handleUpdate('state', e.target.value || undefined)}
              className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
            >
              <option value="">{t('filterStateAll')}</option>
              {stateOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {fields.includes('dateRange') && (
          <div className="grid gap-2">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">{t('filterDateFrom')}</label>
              <input
                type="date"
                value={value.dateFrom || ''}
                onChange={(e) => handleUpdate('dateFrom', e.target.value || undefined)}
                className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">{t('filterDateTo')}</label>
              <input
                type="date"
                value={value.dateTo || ''}
                onChange={(e) => handleUpdate('dateTo', e.target.value || undefined)}
                className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
              />
            </div>
          </div>
        )}

        {fields.includes('accountType') && (
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">{t('filterAccountType')}</label>
            <select
              value={value.accountType || ''}
              onChange={(e) => handleUpdate('accountType', e.target.value || undefined)}
              className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
            >
              <option value="">{t('filterAccountTypeAll')}</option>
              {accountTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {fields.includes('active') && (
          <div className="flex items-center space-x-2 pt-6">
            <label className="inline-flex items-center text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={Boolean(value.active)}
                onChange={(e) => handleUpdate('active', e.target.checked)}
                className="mr-2 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
              />
              {t('filterActiveOnly')}
            </label>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onApply}
          disabled={loading}
          className="px-3 py-2 rounded bg-violet-600 text-white text-sm disabled:opacity-50"
        >
          {t('applyFilters')}
        </button>
        <button
          type="button"
          onClick={handleClear}
          disabled={loading}
          className="px-3 py-2 rounded border border-gray-300 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-200"
        >
          {t('clearFilters')}
        </button>
      </div>
    </div>
  );
}
