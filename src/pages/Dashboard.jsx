import React from 'react';
import { useLang } from '../context/LangContext';

// Sidebar and Header are provided globally by MainLayout
import ErpSummaryPanel from '../components/ErpSummaryPanel';
import RecentOrdersWidget from '../components/RecentOrdersWidget';

function Dashboard() {
  const { t } = useLang();

  return (
    <div>
      <main className="grow">
        <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
          {/* Dashboard actions */}
          <div className="sm:flex sm:justify-between sm:items-center mb-8">
            <div className="mb-4 sm:mb-0">
              <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">{t('dashboard')}</h1>
            </div>
          </div>
          
          <ErpSummaryPanel />
          
          <RecentOrdersWidget />

        </div>
      </main>
    </div>
  );
}

export default Dashboard;