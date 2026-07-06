import React, { useState, useRef, useEffect } from 'react';
import { useLang } from '../context/LangContext';
import { getOdooProducts } from '../services/ServiceGateway';
import PageHeader from '../components/PageHeader';
import PageCard from '../components/PageCard';
import StateBadge from '../components/StateBadge';

export default function BarcodeMVP() {
  const { t } = useLang();
  const [scannedCode, setScannedCode] = useState('');
  const [scanHistory, setScanHistory] = useState([]);
  const [mode, setMode] = useState('inventory'); // inventory, delivery, receipt
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  // Auto-focus the hidden input for USB scanner guns
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleScan = async (e) => {
    e.preventDefault();
    const code = scannedCode.trim();
    if (!code) return;

    setLoading(true);
    try {
      const products = await getOdooProducts(1, ['id', 'name', 'default_code', 'qty_available'], {
        search: code
      });

      const matchedProduct = Array.isArray(products) && products.length > 0 ? products[0] : null;

      const newScan = {
        id: Date.now(),
        code,
        timestamp: new Date().toLocaleTimeString(),
        mode,
        status: matchedProduct ? 'success' : 'warning',
        product: matchedProduct 
          ? `${matchedProduct.name} (${matchedProduct.qty_available} units in stock)`
          : 'Unknown Product / SKU'
      };

      setScanHistory(prev => [newScan, ...prev].slice(0, 10)); // Keep last 10
    } catch (err) {
      const newScan = {
        id: Date.now(),
        code,
        timestamp: new Date().toLocaleTimeString(),
        mode,
        status: 'error',
        product: 'Lookup failed (ERP Offline)'
      };
      setScanHistory(prev => [newScan, ...prev].slice(0, 10));
    } finally {
      setScannedCode('');
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  return (
    <section>
      <PageHeader
        title="Barcode Operations"
        subtitle="Scan barcodes or enter SKUs to retrieve Odoo stock metadata."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <PageCard>
            <h2 className="font-semibold text-sm mb-3 text-gray-900 dark:text-white">Operation Mode</h2>
            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-2.5 text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                <input
                  type="radio"
                  name="mode"
                  checked={mode === 'inventory'}
                  onChange={() => setMode('inventory')}
                  className="form-radio text-violet-600 focus:ring-violet-500 border-gray-300 dark:border-gray-700 dark:bg-gray-900"
                />
                Inventory Count
              </label>
              <label className="flex items-center gap-2.5 text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                <input
                  type="radio"
                  name="mode"
                  checked={mode === 'receipt'}
                  onChange={() => setMode('receipt')}
                  className="form-radio text-violet-600 focus:ring-violet-500 border-gray-300 dark:border-gray-700 dark:bg-gray-900"
                />
                Goods Receipt
              </label>
              <label className="flex items-center gap-2.5 text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                <input
                  type="radio"
                  name="mode"
                  checked={mode === 'delivery'}
                  onChange={() => setMode('delivery')}
                  className="form-radio text-violet-600 focus:ring-violet-500 border-gray-300 dark:border-gray-700 dark:bg-gray-900"
                />
                Delivery Out
              </label>
            </div>
          </PageCard>

          <PageCard>
            <h2 className="font-semibold text-sm mb-3 text-gray-900 dark:text-white">Scanner Input</h2>
            <form onSubmit={handleScan} className="space-y-3">
              <input
                ref={inputRef}
                type="text"
                value={scannedCode}
                onChange={(e) => setScannedCode(e.target.value)}
                placeholder="Scan barcode/SKU here..."
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900 focus:outline-none focus:border-violet-500 dark:text-gray-150 disabled:opacity-50"
                autoComplete="off"
              />
              <button 
                type="submit" 
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? 'Processing...' : 'Process Scan'}
              </button>
            </form>
            <p className="text-xs text-gray-400 dark:text-gray-505 mt-3 text-center">
              Ready for USB scanner gun emulation.
            </p>
          </PageCard>
        </div>

        <div className="md:col-span-2">
          <PageCard className="h-full min-h-[300px]">
            <h2 className="font-semibold text-sm mb-4 text-gray-900 dark:text-white">Recent Scans</h2>
            {scanHistory.length === 0 ? (
              <div className="text-gray-400 dark:text-gray-550 flex items-center justify-center h-48 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-lg">
                No scans recorded yet. Start scanning.
              </div>
            ) : (
              <div className="space-y-3">
                {scanHistory.map(scan => {
                  const stateMap = {
                    success: 'posted',
                    warning: 'warning',
                    error: 'danger'
                  };
                  return (
                    <div key={scan.id} className="flex items-center justify-between p-3 border border-gray-100 dark:border-gray-850 rounded-lg bg-gray-50/50 dark:bg-gray-900/50 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                      <div>
                        <div className="font-mono text-violet-600 dark:text-violet-400 font-bold text-sm">{scan.code}</div>
                        <div className="text-sm text-gray-800 dark:text-gray-200 mt-0.5">{scan.product}</div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-gray-400 dark:text-gray-500 block mb-1">{scan.timestamp}</span>
                        <StateBadge state={stateMap[scan.status] || 'neutral'} label={`${scan.mode}: ${scan.status}`} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </PageCard>
        </div>
      </div>
    </section>
  );
}
