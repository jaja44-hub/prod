import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';
import PageCard from '../components/PageCard';
import DataTable from '../components/DataTable';
import StateBadge from '../components/StateBadge';
import { formatEtb } from '../lib/formatEtb';

export default function VATReturns() {
  const { currentUser, loading: authLoading } = useAuth();
  const [vatReturns, setVatReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('2026-02');

  useEffect(() => {
    async function loadVATReturns() {
      setLoading(true);
      try {
        // Mock data for now - will connect to backend API later
        const mockReturns = [
          {
            id: 1,
            period: '2026-02',
            output_vat: 0,
            input_vat: 133725,
            vat_payable: 0,
            vat_refundable: 133725,
            status: 'filed',
            filing_date: '2026-03-15'
          },
          {
            id: 2,
            period: '2026-01',
            output_vat: 45000,
            input_vat: 28000,
            vat_payable: 17000,
            vat_refundable: 0,
            status: 'pending',
            filing_date: null
          }
        ];
        setVatReturns(mockReturns);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (!authLoading && currentUser) loadVATReturns();
  }, [authLoading, currentUser]);

  const columns = [
    { key: 'period', header: 'Period' },
    { key: 'output_vat', header: 'Output VAT', render: (r) => formatEtb(r.output_vat) },
    { key: 'input_vat', header: 'Input VAT', render: (r) => formatEtb(r.input_vat) },
    { key: 'vat_payable', header: 'VAT Payable', render: (r) => r.vat_payable > 0 ? formatEtb(r.vat_payable) : '—' },
    { key: 'vat_refundable', header: 'VAT Refundable', render: (r) => r.vat_refundable > 0 ? formatEtb(r.vat_refundable) : '—' },
    { key: 'status', header: 'Status', render: (r) => <StateBadge state={r.status} label={r.status} /> },
    { key: 'filing_date', header: 'Filing Date', render: (r) => r.filing_date ? new Date(r.filing_date).toLocaleDateString() : '—' }
  ];

  const currentReturn = vatReturns.find(r => r.period === selectedPeriod);

  return (
    <section>
      <PageHeader title="VAT Returns" subtitle="Manage VAT filing and reporting" />
      
      {currentReturn && (
        <PageCard className="mb-6">
          <h3 className="text-lg font-semibold mb-4">VAT Return - {selectedPeriod}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded">
              <div className="text-sm text-gray-600">Output VAT</div>
              <div className="text-2xl font-bold">{formatEtb(currentReturn.output_vat)}</div>
            </div>
            <div className="p-4 bg-gray-50 rounded">
              <div className="text-sm text-gray-600">Input VAT</div>
              <div className="text-2xl font-bold">{formatEtb(currentReturn.input_vat)}</div>
            </div>
            <div className="p-4 bg-green-50 rounded">
              <div className="text-sm text-gray-600">VAT Payable</div>
              <div className="text-2xl font-bold text-green-600">{currentReturn.vat_payable > 0 ? formatEtb(currentReturn.vat_payable) : 'ETB 0'}</div>
            </div>
            <div className="p-4 bg-blue-50 rounded">
              <div className="text-sm text-gray-600">VAT Refundable</div>
              <div className="text-2xl font-bold text-blue-600">{currentReturn.vat_refundable > 0 ? formatEtb(currentReturn.vat_refundable) : 'ETB 0'}</div>
            </div>
          </div>
          {currentReturn.status === 'pending' && (
            <button className="mt-4 px-6 py-2 bg-violet-600 text-white rounded">File Return</button>
          )}
        </PageCard>
      )}

      <PageCard>
        <DataTable columns={columns} rows={vatReturns} rowKey="id" loading={loading} />
      </PageCard>
    </section>
  );
}
