/**
 * src/pages/FinanceInvoices.jsx
 * Finance invoices page - unique view for invoice management
 */

import React, { useEffect, useState } from 'react';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import { getJournalEntries } from '../lib/neonFinanceAPI';
import ListFilterBar from '../components/ListFilterBar';
import PageHeader from '../components/PageHeader';
import PageCard from '../components/PageCard';
import DataTable from '../components/DataTable';
import StateBadge from '../components/StateBadge';
import { formatEtb } from '../lib/formatEtb';
import useAnalyticsSnapshot from '../hooks/useAnalyticsSnapshot';
import { MetricTile, currency } from '../components/analytics/AnalyticsCharts';

export default function FinanceInvoices() {
  const { t } = useLang();
  const { currentUser, loading: authLoading } = useAuth();
  const { snapshot } = useAnalyticsSnapshot();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ search: '', state: '', partner_id: '' });

  useEffect(() => {
    let mounted = true;
    async function loadInvoices() {
      setLoading(true);
      setError('');
      try {
        const result = await getJournalEntries({ tenant_id: 'tenant_default' });
        if (mounted) setInvoices(Array.isArray(result.data) ? result.data : []);
      } catch (err) {
        if (mounted) setError(err?.error || err?.message || 'Error');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    if (authLoading || !currentUser) return;
    loadInvoices();
    return () => { mounted = false; };
  }, [currentUser, authLoading]);

  const columns = [
    { key: 'entry_number', header: t('invoice') || 'Entry #', render: (r) => r.entry_number || '—' },
    { key: 'entry_type', header: t('type') || 'Type', render: (r) => r.entry_type || '—' },
    { key: 'entry_date', header: t('date') || 'Date', render: (r) => r.entry_date ? new Date(r.entry_date).toLocaleDateString() : '—' },
    { key: 'total_debit', header: t('amount') || 'Debit', className: 'erp-num', render: (r) => r.total_debit != null ? formatEtb(r.total_debit) : '—' },
    { key: 'description', header: t('description') || 'Description', render: (r) => r.description || '—' },
  ];

  const totalInvoiced = invoices.reduce((sum, inv) => sum + (inv.total_debit || 0), 0);
  const postedInvoices = invoices.filter(inv => inv.entry_type === 'PURCHASE_ORDER').length;
  const draftInvoices = invoices.filter(inv => inv.entry_type === 'WAREHOUSE_RECEIPT').length;

  return (
    <section>
      <PageHeader
        title={t('invoices') || 'Invoices'}
        subtitle={t('invoicesDescription') || 'Manage customer invoices and billing'}
      />

      <PageCard className="mb-6">
        <div className="grid gap-4 md:grid-cols-3">
          <MetricTile label="Total Entries" value={invoices.length} detail="Journal entries" tone="violet" />
          <MetricTile label="PO Entries" value={postedInvoices} detail="Purchase orders" tone="emerald" />
          <MetricTile label="Receipt Entries" value={draftInvoices} detail="Warehouse receipts" tone="amber" />
        </div>
      </PageCard>

      <PageCard>
        {error && (
          <div className="my-4 p-4 bg-red-50 text-red-700 rounded">
            {error}
          </div>
        )}

        <DataTable
          columns={columns}
          rows={invoices}
          rowKey="id"
          loading={loading}
          emptyTitle="No journal entries found"
          emptyIcon="📄"
        />

        {!loading && !error && invoices.length > 0 && (
          <div className="mt-4 flex justify-between items-center text-xs text-gray-400">
            <span>Loaded {invoices.length} journal entries</span>
            <span>End of results</span>
          </div>
        )}
      </PageCard>
    </section>
  );
}
