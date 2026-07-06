import React, { useState, useRef, useEffect } from 'react';
import { useLang } from '../context/LangContext';
import { getOdooProducts } from '../services/ServiceGateway';

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
      // Look up product by default_code or SKU in Odoo
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
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-2">Barcode Operations</h1>
      <p className="text-sm text-gray-600 mb-6">Scan barcodes or enter SKUs to retrieve Odoo stock metadata.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <div className="bg-white dark:bg-gray-800 p-4 rounded shadow-sm mb-4">
            <h2 className="font-semibold mb-3">Operation Mode</h2>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="mode" checked={mode === 'inventory'} onChange={() => setMode('inventory')} />
                Inventory Count
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="mode" checked={mode === 'receipt'} onChange={() => setMode('receipt')} />
                Goods Receipt
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="mode" checked={mode === 'delivery'} onChange={() => setMode('delivery')} />
                Delivery Out
              </label>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded shadow-sm">
            <h2 className="font-semibold mb-3">Scanner Input</h2>
            <form onSubmit={handleScan}>
              <input
                ref={inputRef}
                type="text"
                value={scannedCode}
                onChange={(e) => setScannedCode(e.target.value)}
                placeholder="Scan barcode/SKU here..."
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded mb-3 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-violet-500 disabled:opacity-50"
                autoComplete="off"
              />
              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-2 bg-violet-600 text-white rounded font-semibold hover:bg-violet-700 transition-colors disabled:bg-gray-400"
              >
                {loading ? 'Processing...' : 'Process Scan'}
              </button>
            </form>
            <p className="text-xs text-gray-500 mt-3 text-center">Ready for USB scanner gun emulation.</p>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="bg-white dark:bg-gray-800 p-4 rounded shadow-sm h-full">
            <h2 className="font-semibold mb-4">Recent Scans</h2>
            {scanHistory.length === 0 ? (
              <div className="text-gray-500 flex items-center justify-center h-48 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded">
                No scans recorded yet. Start scanning.
              </div>
            ) : (
              <div className="space-y-3">
                {scanHistory.map(scan => (
                  <div key={scan.id} className="flex items-center justify-between p-3 border border-gray-100 dark:border-gray-700 rounded bg-gray-50 dark:bg-gray-900/50">
                    <div>
                      <div className="font-mono text-violet-600 dark:text-violet-400 font-bold">{scan.code}</div>
                      <div className="text-sm">{scan.product}</div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-gray-500 block mb-1">{scan.timestamp}</span>
                      <span className={`px-2 py-0.5 text-xs rounded uppercase font-bold tracking-wide ${
                        scan.status === 'success' ? 'bg-green-100 text-green-800' :
                        scan.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {scan.mode}: {scan.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
