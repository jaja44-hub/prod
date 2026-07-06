import React from 'react';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';
import PageCard from '../components/PageCard';
import WidgetCard from '../components/WidgetCard';
import ModuleActivityFeed from '../components/ModuleActivityFeed';
import Skeleton from '../components/Skeleton';
import ErpSummaryPanel from '../components/ErpSummaryPanel';
import RecentSalesOrdersWidget from '../components/RecentSalesOrdersWidget';
import LowStockAlertWidget from '../components/LowStockAlertWidget';

export default function Dashboard() {
  const { t } = useLang();
  const { userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div>
        <div className="mb-6 h-8 w-48 erp-skeleton rounded" />
        <Skeleton lines={6} />
      </div>
    );
  }

  return (
    <section>
      <PageHeader
        title={t('dashboard')}
        subtitle={userProfile?.name ? `${t('dashboardWelcome')}, ${userProfile.name}` : undefined}
      />

      <div className="space-y-[var(--section-gap)]">
        {/* KPI Summary */}
        <ErpSummaryPanel />

        {/* Widget grid */}
        <div className="grid gap-[var(--card-gap)] lg:grid-cols-2">
          <RecentSalesOrdersWidget />
          <LowStockAlertWidget />
        </div>

        {/* Live activity feed */}
        <PageCard padding="sm">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-base mb-4">
            Module Activity
          </h3>
          <ModuleActivityFeed />
        </PageCard>
      </div>
    </section>
  );
}
