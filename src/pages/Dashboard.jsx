import React from 'react';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import ErpSummaryPanel from '../components/ErpSummaryPanel';
import RecentSalesOrdersWidget from '../components/RecentSalesOrdersWidget';
import LowStockAlertWidget from '../components/LowStockAlertWidget';

export default function Dashboard() {
  const { t } = useLang();
  const { userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-gray-500">{t('loading')}</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          {t('dashboard')}
        </h1>
        {userProfile?.name && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('dashboardWelcome')}, {userProfile.name}
          </p>
        )}
      </header>

      <ErpSummaryPanel />

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <RecentSalesOrdersWidget />
        <LowStockAlertWidget />
      </div>
    </div>
  );
}
