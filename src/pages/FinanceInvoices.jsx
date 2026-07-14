/**
 * src/pages/FinanceInvoices.jsx
 * Finance invoices page - unique view for invoice management
 */

import React, { useEffect, useState } from 'react';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import {
  getOdooAccountMoves,
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
import { MetricTile, TrendChart, currency } from '../components/analytics/AnalyticsCharts';

export default function FinanceInvoices() {
  const { t } = useLang();
  const { currentUser, loading: authLoading } = useAuth();
  const { snapshot } = useAnalyticsSnapshot();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ search: '', state: '', partner_id: '' });

  const normalizeErrorMessage = (err) => {
    const raw = err?.response?.data?.error || err?.message || t('error');
    return raw === BACKEND_WAKEUP_MESSAGE ? t('backendWakingUp') : raw;
  };

  useEffect(() => {
    let mounted = true;
    async function loadInvoices() {
      setLoading(true);
      setError('');
      try {
        const result = await getOdooAccountMoves({
          search: filters.search || undefined,
          state: filters.state || undefined,
        }, 100);
        if (mounted) setInvoices(Array.isArray(result) ? result : []);
      } catch (err) {
        if (mounted) setError(normalizeErrorMessage(err));
      } finally {
        if (mounted) setLoading(false);
      }
    }
    if (authLoading || !currentUser) return;
    loadInvoices();
    return () => { mounted = false; };
  }, [currentUser, authLoading, filters]);

  const columns = [
    { key: 'name', header: t('invoice') || 'Invoice', render: (r) => r.name || '—' },
    { key: 'partner_id', header: t('customer') || 'Customer', render: (r) => r.partner_id?.[1] || '—' },
    { key: 'invoice_date', header: t('date') || 'Date', render: (r) => r.invoice_date || r.date_invoice || '—' },
    { key: 'amount_total', header: t('amount') || 'Amount', className: 'erp-num', render: (r) => r.amount_total != null ? formatEtb(r.amount_total) : '—' },
    { key: 'state', header: t('state') || 'State', render: (r) => <StateBadge state={r.state === 'posted' ? 'posted' : r.state === 'draft' ? 'waiting' : 'neutral'} label={r.state || '—'} /> },
  ];

  const totalInvoiced = invoices.reduce((sum, inv) => sum + (inv.amount_total || 0), 0);
  const postedInvoices = invoices.filter(inv => inv.state === 'posted').length;
  const draftInvoices = invoices.filter(inv => inv.state === 'draft').length;

  return (
    <section>
      <PageHeader
        title={t('invoices') || 'Invoices'}
        subtitle={t('invoicesDescription') || 'Manage customer invoices and billing'}
      />

      <PageCard className="mb-6">
        <div className="grid gap-4 md:grid-cols-3">
          <MetricTile label="Total Invoiced" value={currency(totalInvoiced)} detail="All time" tone="violet" />
          <MetricTile label="Posted" value={postedInvoices} detail="Confirmed" tone="emerald" />
          <MetricTile label="Draft" value={draftInvoices} detail="Pending" tone="amber" />
        </div>
      </PageCard>

      <PageCard>
        <ListFilterBar
          model="account.move"
          value={filters}
          onChange={setFilters}
          onApply={() => setFilters((current) => ({ ...current }))}
          onClear={() => setFilters({ search: '', state: '', partner_id: '' })}
          fields={['search', 'state']}
          stateOptions={[
            { value: 'draft', label: 'Draft' },
            { value: 'posted', label: 'Posted' },
            { value: 'cancel', label: 'Cancelled' },
          ]}
          loading={loading}
        />

        {error && (
          <div className="my-4">
            <BackendStatusBanner message={error} onRetry={() => setFilters((current) => ({ ...current }))} />
          </div>
        )}

        <DataTable
          columns={columns}
          rows={invoices}
          rowKey="id"
          loading={loading}
          emptyTitle="No invoices found"
          emptyIcon="📄"
        />

        {!loading && !error && invoices.length > 0 && (
          <div className="mt-4 flex justify-between items-center text-xs text-gray-400">
            <span>Loaded {invoices.length} invoices</span>
            <span>End of results</span>
          </div>
        )}
      </PageCard>
    </section>
  );
}
