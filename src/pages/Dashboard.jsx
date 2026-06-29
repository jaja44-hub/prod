import React from 'react';
import ErpSummaryPanel from '../components/ErpSummaryPanel';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';

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

      <section className="mt-8 rounded-lg border border-dashed border-slate-300 dark:border-slate-600 p-6 text-center text-sm text-gray-500 dark:text-gray-400">
        {t('dashboardWidgetsComingSoon')}
      </section>
    </div>
  );
}
