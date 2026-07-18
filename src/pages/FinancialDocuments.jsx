import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getPurchaseOrders } from '../lib/neonPurchaseAPI';
import { getWarehouseReceipts } from '../lib/neonWarehouseAPI';
import { getJournalEntries } from '../lib/neonFinanceAPI';
import PageHeader from '../components/PageHeader';
import PageCard from '../components/PageCard';
import DataTable from '../components/DataTable';
import StateBadge from '../components/StateBadge';
import { formatEtb } from '../lib/formatEtb';

export default function FinancialDocuments() {
  const { currentUser, loading: authLoading } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('all');

  useEffect(() => {
    async function loadDocuments() {
      setLoading(true);
      try {
        const [pos, receipts, journalEntries] = await Promise.all([
          getPurchaseOrders({ tenant_id: 'tenant_default' }),
          getWarehouseReceipts({ tenant_id: 'tenant_default' }),
          getJournalEntries({ tenant_id: 'tenant_default' })
        ]);
        const docs = [
          ...(pos.data || pos).map(p => ({ ...p, type: 'PO', number: p.po_number, date: p.po_date, amount: p.total_amount })),
          ...(receipts.data || receipts).map(r => ({ ...r, type: 'RECEIPT', number: r.receipt_number, date: r.received_at, amount: r.quantity_accepted })),
          ...(journalEntries.data || journalEntries).map(j => ({ ...j, type: 'JOURNAL', number: j.entry_number, date: j.entry_date, amount: j.total_debit }))
        ];
        setDocuments(docs);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (!authLoading && currentUser) loadDocuments();
  }, [authLoading, currentUser]);

  const filteredDocs = selectedType === 'all' ? documents : documents.filter(d => d.type === selectedType);
  const columns = [
    { key: 'type', header: 'Type' },
    { key: 'number', header: 'Number' },
    { key: 'date', header: 'Date', render: (r) => r.date ? new Date(r.date).toLocaleDateString() : '—' },
    { key: 'amount', header: 'Amount', render: (r) => formatEtb(r.amount) },
    { key: 'status', header: 'Status', render: (r) => <StateBadge state={r.status} label={r.status} /> }
  ];

  return (
    <section>
      <PageHeader title="Financial Documents" subtitle="Generate and manage financial documents" />
      <div className="mb-4 flex gap-2">
        {['all', 'PO', 'RECEIPT', 'JOURNAL'].map(type => (
          <button key={type} onClick={() => setSelectedType(type)} className={`px-4 py-2 rounded ${selectedType === type ? 'bg-violet-600 text-white' : 'bg-gray-100'}`}>{type}</button>
        ))}
      </div>
      <PageCard><DataTable columns={columns} rows={filteredDocs} rowKey="id" loading={loading} /></PageCard>
    </section>
  );
}
