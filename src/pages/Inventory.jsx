import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { InventoryService } from '../services/InventoryService'

export default function Inventory() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [pageSize] = useState(25)
  const [lastId, setLastId] = useState(null)
  const [endReached, setEndReached] = useState(false)
  const [queryText, setQueryText] = useState('')

  const navigate = useNavigate()

  useEffect(() => {
    let mounted = true
    async function loadFirst() {
      setLoading(true)
      const res = await InventoryService.listItemsPage(pageSize, null)
      if (mounted) {
        setItems(res.items || [])
        setLastId(res.lastId)
        setEndReached(!(res.items && res.items.length))
      }
      setLoading(false)
    }
    loadFirst()
    return () => (mounted = false)
  }, [pageSize])

  const filtered = items.filter((it) => {
    if (!queryText) return true
    const q = queryText.toLowerCase()
    return (it.name || '').toLowerCase().includes(q) || (it.sku || '').toLowerCase().includes(q)
  })

  function openCreate() {
    navigate('/inventory/new')
  }

  function openEdit(it) {
    if (it && it.id) navigate(`/inventory/${it.id}`)
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Inventory</h1>
      <p className="text-sm text-gray-600 mb-4">Production sector inventory items (tenant-scoped).</p>
      <div className="bg-white dark:bg-gray-800 p-4 rounded shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <input value={queryText} onChange={(e) => setQueryText(e.target.value)} placeholder="Search SKU or name" className="px-3 py-1 rounded border" />
            <button onClick={() => setQueryText('')} className="text-xs text-gray-500">Clear</button>
          </div>
          <div>
            <button onClick={openCreate} className="bg-violet-600 text-white px-3 py-1 rounded">New Item</button>
          </div>
        </div>

        {loading ? (
          <p className="text-gray-500">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="text-gray-500">No items found for this tenant.</p>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="py-2">SKU</th>
                  <th className="py-2">Name</th>
                  <th className="py-2">Qty</th>
                  <th className="py-2">Unit</th>
                  <th className="py-2">Location</th>
                  <th className="py-2"> </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((it) => (
                  <tr key={it.id} className="border-t">
                    <td className="py-2">{it.sku}</td>
                    <td className="py-2">{it.name}</td>
                    <td className="py-2">{it.quantity}</td>
                    <td className="py-2">{it.unit}</td>
                    <td className="py-2">{it.location}</td>
                    <td className="py-2">
                      <button onClick={() => openEdit(it)} className="text-xs text-violet-600">View / Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex items-center justify-between mt-4">
              <div className="text-xs text-gray-500">Loaded {items.length} items</div>
              <div>
                {!endReached ? (
                  <button onClick={async () => {
                    setLoading(true)
                    const res = await InventoryService.listItemsPage(pageSize, lastId)
                    setItems([...(items || []), ...(res.items || [])])
                    setLastId(res.lastId)
                    if (!res.items || res.items.length === 0) setEndReached(true)
                    setLoading(false)
                  }} className="px-3 py-1 border rounded">Load more</button>
                ) : (
                  <span className="text-xs text-gray-500">End of results</span>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
