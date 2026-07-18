import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getWarehouseReceipts, getWarehouseReceipt, processWarehouseReceipt } from '../lib/neonWarehouseAPI';
import { getPurchaseOrders } from '../lib/neonPurchaseAPI';
import PageHeader from '../components/PageHeader';
import PageCard from '../components/PageCard';
import DataTable from '../components/DataTable';
import StateBadge from '../components/StateBadge';
import { formatEtb } from '../lib/formatEtb';

export default function WarehouseReceipts() {
  const { currentUser, loading: authLoading } = useAuth();
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [purchaseOrders, setPurchaseOrders] = useState([]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [receiptsResult, ordersResult] = await Promise.all([
          getWarehouseReceipts({ tenant_id: 'tenant_default' }),
          getPurchaseOrders({ tenant_id: 'tenant_default' })
        ]);
        setReceipts(Array.isArray(receiptsResult.data) ? receiptsResult.data : []);
        setPurchaseOrders(Array.isArray(ordersResult.data) ? ordersResult.data : []);
      } catch (err) {
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    }
    if (!authLoading && currentUser) loadData();
  }, [authLoading, currentUser]);

  async function handleViewReceipt(item) {
    try {
      const result = await getWarehouseReceipt(item.id);
      setSelectedReceipt(result.data || result);
    } catch (err) {
      console.error('Error loading receipt:', err);
    }
  }

  async function handleProcessReceipt(inspectionResult) {
    if (!selectedReceipt) return;
    try {
      await processWarehouseReceipt(selectedReceipt.receipt?.id || selectedReceipt.id, {
        processed_by: currentUser?.uid,
        processed_by_name: currentUser?.displayName || 'System',
        inspection_result: inspectionResult,
        notes: 'Quality inspection completed'
      });
      const result = await getWarehouseReceipts({ tenant_id: 'tenant_default' });
      setReceipts(Array.isArray(result.data) ? result.data : []);
      if (selectedReceipt?.receipt?.id || selectedReceipt?.id) {
        const updated = await getWarehouseReceipt(selectedReceipt.receipt?.id || selectedReceipt.id);
        setSelectedReceipt(updated.data || updated);
      }
    } catch (err) {
      console.error('Error processing receipt:', err);
    }
  }

  const columns = [
    { key: 'receipt_number', header: 'Receipt #', render: (r) => r.receipt_number || '—' },
    { key: 'po_number', header: 'PO #', render: (r) => r.po_number || '—' },
    { key: 'supplier_name', header: 'Supplier', render: (r) => r.supplier_name || '—' },
    { key: 'status', header: 'Status', render: (r) => <StateBadge state={r.status} label={r.status} /> },
    { key: 'actions', header: '', render: (r) => (
      <button onClick={() => handleViewReceipt(r)} className="text-xs text-violet-600">View</button>
    )},
  ];

  return (
    <section>
      <PageHeader title="Warehouse Receipts" subtitle="Manage goods receipts" />
      <PageCard>
        <DataTable columns={columns} rows={receipts} rowKey="id" loading={loading} />
      </PageCard>
      {selectedReceipt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-6">
            <button onClick={() => setSelectedReceipt(null)} className="absolute top-4 right-4 text-gray-500">✕</button>
            <h2 className="text-xl font-bold mb-4">{selectedReceipt.receipt?.receipt_number || selectedReceipt.receipt_number}</h2>
            <div className="grid grid-cols-2 gap-4">
              <div><span className="text-xs text-gray-500">PO:</span><span className="text-sm font-semibold ml-2">{selectedReceipt.receipt?.po_number || selectedReceipt.po_number}</span></div>
              <div><span className="text-xs text-gray-500">Supplier:</span><span className="text-sm font-semibold ml-2">{selectedReceipt.receipt?.supplier_name || selectedReceipt.supplier_name}</span></div>
              <div><span className="text-xs text-gray-500">Status:</span><StateBadge state={selectedReceipt.receipt?.status || selectedReceipt.status} label={selectedReceipt.receipt?.status || selectedReceipt.status} /></div>
              <div><span className="text-xs text-gray-500">Qty Received:</span><span className="text-sm font-semibold ml-2">{selectedReceipt.receipt?.quantity_received || selectedReceipt.quantity_received}</span></div>
            </div>
            {selectedReceipt.items && selectedReceipt.items.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-semibold mb-2">Items</h3>
                <div className="bg-gray-50 dark:bg-gray-700 rounded p-2">
                  {selectedReceipt.items.map((item, idx) => (
                    <div key={idx} className="text-xs py-1 border-b last:border-0">
                      {item.product_name} - Qty: {item.quantity_received}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {(selectedReceipt.receipt?.status === 'pending' || selectedReceipt.status === 'pending') && (
              <div className="mt-4 flex gap-2">
                <button onClick={() => handleProcessReceipt('approved')} className="flex-1 px-4 py-2 bg-green-600 text-white rounded">Approve</button>
                <button onClick={() => handleProcessReceipt('rejected')} className="flex-1 px-4 py-2 bg-red-600 text-white rounded">Reject</button>
              </div>
            )}
            <button onClick={() => setSelectedReceipt(null)} className="mt-4 w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded">Close</button>
          </div>
        </div>
      )}
    </section>
  );
}
