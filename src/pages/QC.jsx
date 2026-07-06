import React, { useState, useEffect } from 'react';
import { useLang } from '../context/LangContext';
import { getOdooManufacturingOrders, getOdooPurchaseOrders } from '../services/ServiceGateway';
import PageHeader from '../components/PageHeader';
import PageCard from '../components/PageCard';
import DataTable from '../components/DataTable';
import StateBadge from '../components/StateBadge';

export default function QCModule() {
  const { t } = useLang();
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function fetchQCData() {
      setLoading(true);
      setError('');
      try {
        const [moList, poList] = await Promise.all([
          getOdooManufacturingOrders(10, {}).catch(() => []),
          getOdooPurchaseOrders(10, {}).catch(() => []),
        ]);

        if (!active) return;

        const mappedMOs = (Array.isArray(moList) ? moList : []).map(mo => ({
          id: `QC-MO-${mo.id}`,
          reference: mo.name || `MO #${mo.id}`,
          product: mo.product_id?.[1] || 'Unknown Product',
          date: mo.date_planned_start?.split(' ')[0] || new Date().toISOString().split('T')[0],
          status: mo.state === 'done' ? 'passed' : mo.state === 'cancel' ? 'failed' : 'pending',
          type: 'Manufacturing Order'
        }));

        const mappedPOs = (Array.isArray(poList) ? poList : []).map(po => ({
          id: `QC-PO-${po.id}`,
          reference: po.name || `PO #${po.id}`,
          product: 'Incoming Material Check',
          date: po.date_order?.split(' ')[0] || new Date().toISOString().split('T')[0],
          status: po.state === 'purchase' ? 'passed' : po.state === 'cancel' ? 'failed' : 'pending',
          type: 'Purchase Receipt'
        }));

        setInspections([...mappedMOs, ...mappedPOs]);
      } catch (err) {
        if (active) {
          setError(err?.message || 'Failed to fetch Odoo quality checkpoints.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    fetchQCData();
    return () => {
      active = false;
    };
  }, []);

  const handleAction = (id, newStatus) => {
    setInspections(prev => prev.map(ins => ins.id === id ? { ...ins, status: newStatus } : ins));
  };

  const columns = [
    { key: 'id', header: 'Inspection ID', className: 'font-semibold text-violet-700 dark:text-violet-400' },
    { key: 'type', header: 'Type', className: 'text-xs text-gray-500' },
    { key: 'reference', header: 'Reference' },
    { key: 'product', header: 'Product / Check' },
    { key: 'date', header: 'Date' },
    { key: 'status', header: 'Status', render: (r) => {
      const stateMap = {
        passed: 'posted',
        failed: 'danger',
        pending: 'waiting'
      };
      return <StateBadge state={stateMap[r.status] || 'neutral'} label={r.status} />;
    }},
    { key: 'actions', header: '', className: 'text-right', render: (r) => (
      <div className="flex justify-end gap-2">
        {r.status === 'pending' ? (
          <>
            <button onClick={() => handleAction(r.id, 'passed')} className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded transition duration-150">Pass</button>
            <button onClick={() => handleAction(r.id, 'failed')} className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded transition duration-150">Fail</button>
          </>
        ) : (
          <span className="text-gray-400 text-xs italic py-1">Completed</span>
        )}
      </div>
    )},
  ];

  return (
    <section>
      <PageHeader
        title="Quality Control"
        subtitle="Manage inspection points for manufacturing and inventory receipts."
      />

      <PageCard>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400">
            {error}
          </div>
        )}

        <DataTable
          columns={columns}
          rows={inspections}
          rowKey="id"
          loading={loading}
          emptyTitle="No pending quality inspections found"
          emptyIcon="✅"
        />
      </PageCard>
    </section>
  );
}
