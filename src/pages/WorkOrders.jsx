import React, { useEffect, useState } from 'react'
import { WorkOrderService } from '../services/WorkOrderService'

export default function WorkOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      const data = await WorkOrderService.listWorkOrders()
      if (mounted) setOrders(data || [])
      setLoading(false)
    }
    load()
    return () => (mounted = false)
  }, [])

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Work Orders</h1>
      <p className="text-sm text-gray-600 mb-4">Production sector work orders (tenant-scoped).</p>
      <div className="bg-white dark:bg-gray-800 p-4 rounded shadow-sm">
        {loading ? (
          <p className="text-gray-500">Loading…</p>
        ) : orders.length === 0 ? (
          <p className="text-gray-500">No work orders found for this tenant.</p>
        ) : (
          <ul>
            {orders.map((o) => (
              <li key={o.id} className="py-2 border-t">
                <div className="font-medium">{o.reference} — {o.title}</div>
                <div className="text-xs text-gray-500">Status: {o.status} • Priority: {o.priority}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
