import React, { useEffect, useState } from 'react';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import {
  getOdooAccounts,
  getOdooJournals,
  getOdooPayments,
  BACKEND_WAKEUP_MESSAGE
} from '../services/ServiceGateway';
import ListFilterBar from '../components/ListFilterBar';
import PageHeader from '../components/PageHeader';
import PageCard from '../components/PageCard';
import DataTable from '../components/DataTable';
import StateBadge from '../components/StateBadge';
import BackendStatusBanner from '../components/BackendStatusBanner';
import { formatEtb } from '../lib/formatEtb';
import useAnalyticsSnapshot from '../hooks/useAnalyticsSnapshot';
import { MetricTile, TrendChart, BreakdownList, InsightPills, currency } from '../components/analytics/AnalyticsCharts';

export default function Accounts() {
  const { t } = useLang();
  const { currentUser, loading: authLoading, tenantConfig } = useAuth();
  const { snapshot: analyticsSnapshot } = useAnalyticsSnapshot();
  const isET = tenantConfig?.complianceProfile === 'ethiopia_primary';
  const [activeTab, setActiveTab] = useState('accounts'); // 'accounts', 'journals', 'payments'
  const [accounts, setAccounts] = useState([]);
  const [journals, setJournals] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ search: '', accountType: '', active: true });

  const normalizeErrorMessage = (err) => {
    const raw = err?.response?.data?.error || err?.message || t('error');
    return raw === BACKEND_WAKEUP_MESSAGE ? t('backendWakingUp') : raw;
  };

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      setLoading(true);
      setError('');
      try {
        if (activeTab === 'accounts') {
          const result = await getOdooAccounts(100, {
            search: filters.search || undefined,
            account_type: filters.accountType || undefined,
            active: filters.active,
          });
          if (mounted) setAccounts(Array.isArray(result) ? result : []);
        } else if (activeTab === 'journals') {
          const result = await getOdooJournals(100);
          if (mounted) setJournals(Array.isArray(result) ? result : []);
        } else if (activeTab === 'payments') {
          const result = await getOdooPayments(100);
          let loadedPayments = Array.isArray(result) ? result : [];
          if (isET) {
            const { calculateEthiopianTaxes } = await import('../lib/oracles/settlementOracle');
            loadedPayments = await Promise.all(loadedPayments.map(async (p) => {
               const taxData = await calculateEthiopianTaxes(p.amount || 0, true);
               return { ...p, taxData };
            }));
          }
          if (mounted) setPayments(loadedPayments);
        }
      } catch (err) {
        if (mounted) setError(normalizeErrorMessage(err));
      } finally {
        if (mounted) setLoading(false);
      }
    }
    if (authLoading || !currentUser) return;
    loadData();
    return () => { mounted = false; };
  }, [currentUser, authLoading, activeTab, filters]);

  // Define Columns per Tab
  const accountColumns = [
    { key: 'code', header: t('code'), render: (r) => r.code || '—' },
    { key: 'name', header: t('accounts') },
    { key: 'account_type', header: t('accountType'), render: (r) => r.account_type || '—' },
  ];

  const journalColumns = [
    { key: 'name', header: t('name') || 'Name' },
    { key: 'code', header: t('code') || 'Code' },
    { key: 'type', header: t('type') || 'Type', className: 'capitalize' },
  ];

  const paymentColumns = [
    { key: 'name', header: t('name') || 'Name' },
    { key: 'date', header: t('date') || 'Date' },
    { key: 'payment_type', header: t('paymentType') || 'Payment Type', className: 'capitalize', render: (r) => r.payment_type ? r.payment_type.replace('_', ' ') : '—' },
    { key: 'amount', header: t('amount') || 'Amount', className: 'erp-num', render: (r) => r.amount != null ? formatEtb(r.amount) : '—' },
    ...(isET ? [
      { key: 'vat', header: 'VAT (15%)', className: 'erp-num text-violet-600 dark:text-violet-400 font-mono', render: (r) => r.taxData?.vatAmount != null ? formatEtb(r.taxData.vatAmount) : '—' },
      { key: 'wht', header: 'WHT (2%)', className: 'erp-num text-violet-600 dark:text-violet-400 font-mono', render: (r) => r.taxData?.whtAmount != null ? formatEtb(r.taxData.whtAmount) : '—' },
    ] : []),
    { key: 'partner_id', header: t('partner') || 'Partner', render: (r) => r.partner_id?.[1] || '—' },
    { key: 'state', header: t('state') || 'State', render: (r) => <StateBadge state={r.state === 'posted' ? 'posted' : r.state === 'draft' ? 'waiting' : 'neutral'} label={r.state || '—'} /> },
  ];

  return (
    <section>
      <PageHeader
        title={t('finance')}
        subtitle={t('financeDescription')}
      />

      <PageCard className="mb-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="inline-flex items-center rounded-full bg-violet-100 px-3 py-1 text-sm font-medium text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">Finance analytics</div>
            <h2 className="mt-3 text-lg font-semibold text-slate-900 dark:text-slate-100">Cash-flow pulse and account structure</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">A chart-backed view of receivables, payables, and margin health for the active tenant.</p>
          </div>
        </div>
        <div className="mt-6 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <MetricTile label="Receivables" value={currency(analyticsSnapshot?.modules?.finance?.metrics?.totalReceivable ?? 0)} detail="AR" tone="violet" />
              <MetricTile label="Payables" value={currency(analyticsSnapshot?.modules?.finance?.metrics?.totalPayable ?? 0)} detail="AP" tone="blue" />
              <MetricTile label="Margin" value={`${analyticsSnapshot?.modules?.finance?.metrics?.margin ?? 0}%`} detail="profit" tone="emerald" />
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800/80">
              <div className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">Cash-flow trend</div>
              <TrendChart data={analyticsSnapshot?.modules?.finance?.chartData || []} dataKeys={['receivable', 'payable']} />
            </div>
          </div>
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800/80">
              <div className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">Account structure</div>
              <BreakdownList data={(analyticsSnapshot?.modules?.finance?.breakdown || []).map((item) => ({ ...item, valueLabel: item.name === 'Margin' ? `${item.value}%` : currency(item.value) }))} />
            </div>
            <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-emerald-600 to-cyan-600 p-4 text-white shadow-sm">
              <div className="text-sm font-medium text-emerald-100">Leadership note</div>
              <div className="mt-2 text-lg font-semibold">{analyticsSnapshot?.insights?.find((item) => item.title === 'Revenue pulse')?.detail || 'Collections remain steady and risk remains contained.'}</div>
              <div className="mt-4"><InsightPills items={[{ title: 'Collections steady', direction: 'up' }, { title: 'Risk contained', direction: 'up' }]} /></div>
            </div>
          </div>
        </div>
      </PageCard>

      <PageCard>
        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
          <button
            onClick={() => {
              setActiveTab('accounts');
              setFilters({ search: '', accountType: '', active: true });
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

        {error && (
          <div className="my-4">
            <BackendStatusBanner message={error} onRetry={() => setFilters((current) => ({ ...current }))} />
          </div>
        )}

        {activeTab === 'accounts' && (
          <DataTable
            columns={accountColumns}
            rows={accounts}
            rowKey="id"
            loading={loading}
            emptyTitle={t('noAccountsForTenant')}
            emptyIcon="📁"
          />
        )}

        {activeTab === 'journals' && (
          <DataTable
            columns={journalColumns}
            rows={journals}
            rowKey="id"
            loading={loading}
            emptyTitle="No journals found"
            emptyIcon="📓"
          />
        )}

        {activeTab === 'payments' && (
          <DataTable
            columns={paymentColumns}
            rows={payments}
            rowKey="id"
            loading={loading}
            emptyTitle="No payments found"
            emptyIcon="💸"
          />
        )}

        {!loading && !error && activeTab === 'accounts' && accounts.length > 0 && (
          <div className="mt-4 flex justify-between items-center text-xs text-gray-400">
            <span>{t('loadedAccounts', { count: accounts.length })}</span>
            <span>{t('endOfResults')}</span>
          </div>
        )}
      </PageCard>
    </section>
  );
}
