import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';
import PageCard from '../components/PageCard';
import DataTable from '../components/DataTable';
import StateBadge from '../components/StateBadge';
import { formatEtb } from '../lib/formatEtb';

export default function TaxReconciliation() {
  const { currentUser, loading: authLoading } = useAuth();
  const [withholdingRecords, setWithholdingRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  useEffect(() => {
    async function loadWithholdingRecords() {
      setLoading(true);
      try {
        // Mock data for now - will connect to backend API later
        const mockRecords = [
          {
            id: 1,
            supplier_name: 'Ethio Construction PLC',
            po_number: 'PO-2026-001',
            withholding_rate: 0.02,
            withholding_amount: 1337.25,
            payment_date: '2026-02-15',
            status: 'paid',
            tax_authority_ref: 'ERA-2026-0234'
          },
          {
            id: 2,
            supplier_name: 'Addis Agro Supplies',
            po_number: 'PO-2026-002',
            withholding_rate: 0.05,
            withholding_amount: 3505.00,
            payment_date: '2026-02-20',
            status: 'paid',
            tax_authority_ref: 'ERA-2026-0245'
          },
          {
            id: 3,
            supplier_name: 'Tech Solutions Ethiopia',
            po_number: 'PO-2026-003',
            withholding_rate: 0.10,
            withholding_amount: 8465.00,
            payment_date: null,
            status: 'pending',
            tax_authority_ref: null
          },
          {
            id: 4,
            supplier_name: 'Food Products Importers',
            po_number: 'PO-2026-004',
            withholding_rate: 0.02,
            withholding_amount: 701.00,
            payment_date: null,
            status: 'pending',
            tax_authority_ref: null
          }
        ];
        setWithholdingRecords(mockRecords);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (!authLoading && currentUser) loadWithholdingRecords();
  }, [authLoading, currentUser]);

  const columns = [
    { key: 'supplier_name', header: 'Supplier' },
    { key: 'po_number', header: 'PO Number' },
    { key: 'withholding_rate', header: 'Withholding Rate', render: (r) => `${(r.withholding_rate * 100).toFixed(0)}%` },
    { key: 'withholding_amount', header: 'Withholding Amount', render: (r) => formatEtb(r.withholding_amount) },
    { key: 'payment_date', header: 'Payment Date', render: (r) => r.payment_date ? new Date(r.payment_date).toLocaleDateString() : '—' },
    { key: 'status', header: 'Status', render: (r) => <StateBadge state={r.status} label={r.status} /> },
    { key: 'tax_authority_ref', header: 'ERA Reference', render: (r) => r.tax_authority_ref || '—' }
  ];

  const totalWithholding = withholdingRecords.reduce((sum, r) => sum + r.withholding_amount, 0);
  const paidWithholding = withholdingRecords.filter(r => r.status === 'paid').reduce((sum, r) => sum + r.withholding_amount, 0);
  const pendingWithholding = withholdingRecords.filter(r => r.status === 'pending').reduce((sum, r) => sum + r.withholding_amount, 0);

  return (
    <section>
      <PageHeader title="Tax Reconciliation" subtitle="Track and reconcile withholding tax payments" />
      
      <PageCard className="mb-6">
        <h3 className="text-lg font-semibold mb-4">Withholding Tax Summary</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 rounded">
            <div className="text-sm text-gray-600">Total Withholding</div>
            <div className="text-2xl font-bold">{formatEtb(totalWithholding)}</div>
          </div>
          <div className="p-4 bg-green-50 rounded">
            <div className="text-sm text-gray-600">Paid to ERA</div>
            <div className="text-2xl font-bold text-green-600">{formatEtb(paidWithholding)}</div>
          </div>
          <div className="p-4 bg-amber-50 rounded">
            <div className="text-sm text-gray-600">Pending Payment</div>
            <div className="text-2xl font-bold text-amber-600">{formatEtb(pendingWithholding)}</div>
          </div>
        </div>
      </PageCard>

      <PageCard>
        <DataTable columns={columns} rows={withholdingRecords} rowKey="id" loading={loading} />
      </PageCard>
    </section>
  );
}
