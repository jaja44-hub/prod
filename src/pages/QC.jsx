import React, { useState, useEffect } from 'react';
import { useLang } from '../context/LangContext';
import { getOdooManufacturingOrders, getOdooPurchaseOrders } from '../services/ServiceGateway';

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

        // Merge MO and PO items into quality control inspection checks
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

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-2">Quality Control</h1>
      <p className="text-sm text-gray-600 mb-6">Manage inspection points for manufacturing and inventory receipts.</p>

      {loading ? (
        <p className="text-gray-500">Loading quality control endpoints...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : inspections.length === 0 ? (
        <p className="text-gray-500">No pending quality inspections found.</p>
      ) : (
        <div className="bg-white dark:bg-gray-800 p-4 rounded shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm table-auto">
              <thead>
                <tr className="text-left text-gray-600 border-b dark:border-gray-700">
                  <th className="py-2">Inspection ID</th>
                  <th className="py-2">Type</th>
                  <th className="py-2">Reference</th>
                  <th className="py-2">Product / Check</th>
                  <th className="py-2">Date</th>
                  <th className="py-2">Status</th>
                  <th className="py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {inspections.map((ins) => (
                  <tr key={ins.id} className="border-b last:border-b-0 dark:border-gray-700">
                    <td className="py-3 font-semibold text-violet-700 dark:text-violet-400">{ins.id}</td>
                    <td className="py-3 text-xs text-gray-500">{ins.type}</td>
                    <td className="py-3">{ins.reference}</td>
                    <td className="py-3">{ins.product}</td>
                    <td className="py-3">{ins.date}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded text-xs uppercase font-bold ${
                        ins.status === 'passed' ? 'bg-green-100 text-green-800' :
                        ins.status === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {ins.status}
                      </span>
                    </td>
                    <td className="py-3 text-right space-x-2">
                      {ins.status === 'pending' && (
                        <>
                          <button onClick={() => handleAction(ins.id, 'passed')} className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700">Pass</button>
                          <button onClick={() => handleAction(ins.id, 'failed')} className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700">Fail</button>
                        </>
                      )}
                      {ins.status !== 'pending' && (
                        <span className="text-gray-400 text-xs italic">Completed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
