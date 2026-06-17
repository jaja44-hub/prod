import React, { useEffect, useState } from 'react'
import { InventoryService } from '../services/InventoryService'

export default function Inventory() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      const data = await InventoryService.listItems()
      if (mounted) setItems(data || [])
      setLoading(false)
    }
    load()
    return () => (mounted = false)
  }, [])

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Inventory</h1>
      <p className="text-sm text-gray-600 mb-4">Production sector inventory items (tenant-scoped).</p>
      <div className="bg-white dark:bg-gray-800 p-4 rounded shadow-sm">
        {loading ? (
          <p className="text-gray-500">Loading…</p>
        ) : items.length === 0 ? (
          <p className="text-gray-500">No items found for this tenant.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600">
                <th className="py-2">SKU</th>
                <th className="py-2">Name</th>
                <th className="py-2">Qty</th>
                <th className="py-2">Unit</th>
                <th className="py-2">Location</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id} className="border-t">
                  <td className="py-2">{it.sku}</td>
                  <td className="py-2">{it.name}</td>
                  <td className="py-2">{it.quantity}</td>
                  <td className="py-2">{it.unit}</td>
                  <td className="py-2">{it.location}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
