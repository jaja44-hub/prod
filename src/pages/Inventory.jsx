import React from 'react'

export default function Inventory() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Inventory</h1>
      <p className="text-sm text-gray-600 mb-4">Placeholder Inventory page for production sector. Wire to ServiceGateway.getTenantDoc / saveTenantDoc for real data.</p>
      <div className="bg-white dark:bg-gray-800 p-4 rounded shadow-sm">
        <p className="text-gray-500">No items loaded yet. Use the ServiceGateway methods to fetch `inventory_items`.</p>
      </div>
    </div>
  )
}
