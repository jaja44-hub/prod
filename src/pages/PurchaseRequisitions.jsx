import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import {
  getPurchaseRequisitions,
  getPurchaseRequisition,
  submitPurchaseRequisition,
  approvePurchaseRequisition
} from '../lib/neonPurchaseAPI';
import PageHeader from '../components/PageHeader';
import PageCard from '../components/PageCard';
import DataTable from '../components/DataTable';
import StateBadge from '../components/StateBadge';
import { formatEtb } from '../lib/formatEtb';

export default function PurchaseRequisitions() {
  const { t } = useLang();
  const { currentUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [requisitions, setRequisitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRequisition, setSelectedRequisition] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function loadRequisitions() {
      setLoading(true);
      setError('');
      try {
        const result = await getPurchaseRequisitions({ tenant_id: 'tenant_default' });
        if (!mounted) return;
        setRequisitions(Array.isArray(result.data) ? result.data : []);
      } catch (err) {
        if (!mounted) setError(err?.error || err?.message || 'Error');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    if (authLoading || !currentUser) return;
    loadRequisitions();
    return () => { mounted = false; };
  }, [currentUser, authLoading]);

  async function handleViewRequisition(item) {
    if (detailLoading) return;
    setDetailLoading(true);
    try {
      const result = await getPurchaseRequisition(item.id);
      setSelectedRequisition(result.data);
    } catch (err) {
      setError(err?.error || err?.message || 'Error');
    } finally {
      setDetailLoading(false);
    }
  }

  const columns = [
    { key: 'requisition_number', header: 'Requisition', render: (r) => r.requisition_number || '—' },
    { key: 'requested_by_name', header: 'Requested By', render: (r) => r.requested_by_name || '—' },
    { key: 'department', header: 'Department', render: (r) => r.department || '—' },
    { key: 'total_amount', header: 'Amount', render: (r) => r.total_amount != null ? formatEtb(r.total_amount) : '—' },
    { key: 'status', header: 'Status', render: (r) => <StateBadge state={r.status} label={r.status || '—'} /> },
    { key: 'actions', header: '', render: (r) => (
      <button onClick={() => handleViewRequisition(r)} disabled={detailLoading} className="text-xs text-violet-600 font-semibold">
        View
      </button>
    )},
  ];

  return (
    <section>
      <PageHeader title="Purchase Requisitions" subtitle="Manage purchase requisitions" />
      <PageCard>
        {error && <div className="mb-4 text-red-600">{error}</div>}
        <DataTable columns={columns} rows={requisitions} rowKey="id" loading={loading} />
      </PageCard>
      {selectedRequisition && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-6">
            <button onClick={() => setSelectedRequisition(null)} className="absolute top-4 right-4 text-gray-500">✕</button>
            <h2 className="text-xl font-bold mb-4">{selectedRequisition.requisition_number}</h2>
            <div className="grid grid-cols-2 gap-4">
              <div><span className="text-xs text-gray-500">Department:</span><span className="text-sm font-semibold">{selectedRequisition.department}</span></div>
              <div><span className="text-xs text-gray-500">Status:</span><StateBadge state={selectedRequisition.status} label={selectedRequisition.status} /></div>
              <div><span className="text-xs text-gray-500">Amount:</span><span className="text-sm font-semibold">{formatEtb(selectedRequisition.total_amount)}</span></div>
            </div>
            <button onClick={() => setSelectedRequisition(null)} className="mt-4 px-4 py-2 bg-gray-100 rounded">Close</button>
          </div>
        </div>
      )}
    </section>
  );
}
