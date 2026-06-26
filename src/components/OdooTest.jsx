import React, { useState } from 'react';
import { odooClient } from '../lib/odooClient';

export default function OdooTest() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchOdooData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Let's fetch the list of currencies from Odoo as a simple test
      const result = await odooClient.execute('res.currency', 'search_read', 
        [[]], // Empty domain (fetch all)
        { fields: ['name', 'symbol'], limit: 5 } // Options
      );
      setData(result);
    } catch (err) {
      setError(err.message || "Failed to fetch from Odoo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-md space-y-4 mt-10 border border-gray-200">
      <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
        🐘 Odoo Live Connection Test
      </h2>
      <p className="text-gray-500 text-sm">
        This component securely routes through your Vercel Serverless Function to fetch live data from Hugging Face Odoo.
      </p>

      <button 
        onClick={fetchOdooData}
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition-colors disabled:opacity-50"
      >
        {loading ? "Fetching from Odoo..." : "Fetch Odoo Currencies"}
      </button>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-200 break-words">
          <span className="font-bold">Error:</span> {error}
        </div>
      )}

      {data && (
        <div className="mt-4">
          <h3 className="font-semibold text-gray-700 mb-2">Live Data Received:</h3>
          <ul className="bg-gray-50 rounded-md border border-gray-200 divide-y divide-gray-200">
            {data.map((item) => (
              <li key={item.id} className="p-3 text-sm text-gray-700 flex justify-between">
                <span>{item.name}</span>
                <span className="font-bold text-blue-600">{item.symbol}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
