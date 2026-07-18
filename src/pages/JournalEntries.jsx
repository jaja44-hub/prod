import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getJournalEntries } from '../lib/neonFinanceAPI';
import PageHeader from '../components/PageHeader';
import PageCard from '../components/PageCard';
import DataTable from '../components/DataTable';
import StateBadge from '../components/StateBadge';

export default function JournalEntries() {
  const { currentUser, loading: authLoading } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEntries() {
      setLoading(true);
      try {
        const result = await getJournalEntries({ tenant_id: 'tenant_default' });
        setEntries(Array.isArray(result.data) ? result.data : []);
      } catch (err) {
        console.error('Error loading journal entries:', err);
      } finally {
        setLoading(false);
      }
    }
    if (!authLoading && currentUser) loadEntries();
  }, [authLoading, currentUser]);

  const columns = [
    { key: 'entry_number', header: 'Entry #', render: (r) => r.entry_number || '—' },
    { key: 'entry_date', header: 'Date', render: (r) => r.entry_date ? new Date(r.entry_date).toLocaleDateString() : '—' },
    { key: 'entry_type', header: 'Type', render: (r) => r.entry_type || '—' },
    { key: 'description', header: 'Description', render: (r) => r.description || '—' },
    { key: 'total_debit', header: 'Debit', render: (r) => r.total_debit ? Number(r.total_debit).toLocaleString() : '0' },
    { key: 'total_credit', header: 'Credit', render: (r) => r.total_credit ? Number(r.total_credit).toLocaleString() : '0' },
    { key: 'vat_amount', header: 'VAT', render: (r) => r.vat_amount ? Number(r.vat_amount).toLocaleString() : '0' },
  ];

  return (
    <section>
      <PageHeader title="Journal Entries" subtitle="Accounting journal entries" />
      <PageCard>
        <DataTable columns={columns} rows={entries} rowKey="id" loading={loading} />
      </PageCard>
    </section>
  );
}
