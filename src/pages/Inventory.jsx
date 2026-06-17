import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { InventoryService } from '../services/InventoryService'

export default function Inventory() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [queryText, setQueryText] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ sku: '', name: '', quantity: 0, unit: 'pcs', location: '' })

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

  const filtered = items.filter((it) => {
    if (!queryText) return true
    const q = queryText.toLowerCase()
    return (it.name || '').toLowerCase().includes(q) || (it.sku || '').toLowerCase().includes(q)
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize)

  const navigate = useNavigate()

  function openCreate() {
    // navigate to route-based create
    navigate('/inventory/new')
  }

  function openEdit(it) {
    // navigate to item detail/edit route
    if (it && it.id) navigate(`/inventory/${it.id}`)
    else {
      setEditing(it)
      setForm({ sku: it.sku || '', name: it.name || '', quantity: it.quantity || 0, unit: it.unit || 'pcs', location: it.location || '' })
      setShowForm(true)
    }
  }

  async function submitForm(e) {
    e.preventDefault()
    if (editing) {
      await InventoryService.updateItem(editing.id, { ...form })
      const updated = items.map((it) => (it.id === editing.id ? { ...it, ...form } : it))
      setItems(updated)
    } else {
      const created = await InventoryService.createItem(form)
      setItems([...(items || []), created])
    }
    setShowForm(false)
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Inventory</h1>
      <p className="text-sm text-gray-600 mb-4">Production sector inventory items (tenant-scoped).</p>
      <div className="bg-white dark:bg-gray-800 p-4 rounded shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <input value={queryText} onChange={(e) => { setQueryText(e.target.value); setPage(1) }} placeholder="Search SKU or name" className="px-3 py-1 rounded border" />
            <button onClick={() => { setQueryText(''); setPage(1) }} className="text-xs text-gray-500">Clear</button>
          </div>
          <div>
            <button onClick={openCreate} className="bg-violet-600 text-white px-3 py-1 rounded">New Item</button>
          </div>
        </div>

        {loading ? (
          <p className="text-gray-500">Loading…</p>
        ) : pageItems.length === 0 ? (
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
                {pageItems.map((it) => (
                  <tr key={it.id} className="border-t">
                    <td className="py-2">{it.sku}</td>
                    <td className="py-2">{it.name}</td>
                    <td className="py-2">{it.quantity}</td>
                    <td className="py-2">{it.unit}</td>
                    <td className="py-2">{it.location}</td>
                    <td className="py-2">
                      <button onClick={() => openEdit(it)} className="text-xs text-violet-600">Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex items-center justify-between mt-4">
              <div className="text-xs text-gray-500">Page {page} of {totalPages}</div>
              <div className="space-x-2">
                <button disabled={page<=1} onClick={() => setPage((p)=>Math.max(1,p-1))} className="px-2 py-1 border rounded disabled:opacity-50">Prev</button>
                <button disabled={page>=totalPages} onClick={() => setPage((p)=>Math.min(totalPages,p+1))} className="px-2 py-1 border rounded disabled:opacity-50">Next</button>
              </div>
            </div>
          </>
        )}

        {/* Form modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <form onSubmit={submitForm} className="bg-white dark:bg-gray-800 p-6 rounded shadow-lg w-11/12 max-w-md">
              <h3 className="text-lg font-semibold mb-3">{editing ? 'Edit Item' : 'Create Item'}</h3>
              <label className="block mb-2 text-xs">SKU</label>
              <input value={form.sku} onChange={(e)=>setForm({...form, sku:e.target.value})} className="w-full p-2 border rounded mb-2" />
              <label className="block mb-2 text-xs">Name</label>
              <input value={form.name} onChange={(e)=>setForm({...form, name:e.target.value})} className="w-full p-2 border rounded mb-2" />
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block mb-2 text-xs">Qty</label>
                  <input type="number" value={form.quantity} onChange={(e)=>setForm({...form, quantity: Number(e.target.value)})} className="w-full p-2 border rounded" />
                </div>
                <div>
                  <label className="block mb-2 text-xs">Unit</label>
                  <input value={form.unit} onChange={(e)=>setForm({...form, unit:e.target.value})} className="w-full p-2 border rounded" />
                </div>
                <div>
                  <label className="block mb-2 text-xs">Location</label>
                  <input value={form.location} onChange={(e)=>setForm({...form, location:e.target.value})} className="w-full p-2 border rounded" />
                </div>
              </div>
              <div className="mt-4 flex justify-end space-x-2">
                <button type="button" onClick={()=>setShowForm(false)} className="px-3 py-1 border rounded">Cancel</button>
                <button type="submit" className="px-3 py-1 bg-violet-600 text-white rounded">Save</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
