import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { WorkOrderService } from '../services/WorkOrderService'

export default function WorkOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [queryText, setQueryText] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ title: '', description: '', priority: 'normal' })

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

  const filtered = orders.filter((o) => {
    if (!queryText) return true
    const q = queryText.toLowerCase()
    return (o.title || '').toLowerCase().includes(q) || (o.reference || '').toLowerCase().includes(q)
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize)

  const navigate = useNavigate()

  function openCreate() {
    navigate('/work-orders/new')
  }

  function openEdit(o) {
    if (o && o.id) navigate(`/work-orders/${o.id}`)
    else {
      setEditing(o)
      setForm({ title: o.title || '', description: o.description || '', priority: o.priority || 'normal' })
      setShowForm(true)
    }
  }

  async function submitForm(e) {
    e.preventDefault()
    if (editing) {
      await WorkOrderService.updateWorkOrder(editing.id, { ...form })
      const updated = orders.map((it) => (it.id === editing.id ? { ...it, ...form } : it))
      setOrders(updated)
    } else {
      const created = await WorkOrderService.createWorkOrder(form)
      setOrders([...(orders || []), created])
    }
    setShowForm(false)
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Work Orders</h1>
      <p className="text-sm text-gray-600 mb-4">Production sector work orders (tenant-scoped).</p>
      <div className="bg-white dark:bg-gray-800 p-4 rounded shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <input value={queryText} onChange={(e) => { setQueryText(e.target.value); setPage(1) }} placeholder="Search reference or title" className="px-3 py-1 rounded border" />
            <button onClick={() => { setQueryText(''); setPage(1) }} className="text-xs text-gray-500">Clear</button>
          </div>
          <div>
            <button onClick={openCreate} className="bg-violet-600 text-white px-3 py-1 rounded">New Work Order</button>
          </div>
        </div>

        {loading ? (
          <p className="text-gray-500">Loading…</p>
        ) : pageItems.length === 0 ? (
          <p className="text-gray-500">No work orders found for this tenant.</p>
        ) : (
          <>
            <ul>
              {pageItems.map((o) => (
                <li key={o.id} className="py-2 border-t flex justify-between">
                  <div>
                    <div className="font-medium">{o.reference} — {o.title}</div>
                    <div className="text-xs text-gray-500">Status: {o.status} • Priority: {o.priority}</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button onClick={() => openEdit(o)} className="text-xs text-violet-600">Edit</button>
                  </div>
                </li>
              ))}
            </ul>

            <div className="flex items-center justify-between mt-4">
              <div className="text-xs text-gray-500">Page {page} of {totalPages}</div>
              <div className="space-x-2">
                <button disabled={page<=1} onClick={() => setPage((p)=>Math.max(1,p-1))} className="px-2 py-1 border rounded disabled:opacity-50">Prev</button>
                <button disabled={page>=totalPages} onClick={() => setPage((p)=>Math.min(totalPages,p+1))} className="px-2 py-1 border rounded disabled:opacity-50">Next</button>
              </div>
            </div>
          </>
        )}

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <form onSubmit={submitForm} className="bg-white dark:bg-gray-800 p-6 rounded shadow-lg w-11/12 max-w-md">
              <h3 className="text-lg font-semibold mb-3">{editing ? 'Edit Work Order' : 'Create Work Order'}</h3>
              <label className="block mb-2 text-xs">Title</label>
              <input value={form.title} onChange={(e)=>setForm({...form, title:e.target.value})} className="w-full p-2 border rounded mb-2" />
              <label className="block mb-2 text-xs">Description</label>
              <textarea value={form.description} onChange={(e)=>setForm({...form, description:e.target.value})} className="w-full p-2 border rounded mb-2" />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block mb-2 text-xs">Priority</label>
                  <select value={form.priority} onChange={(e)=>setForm({...form, priority:e.target.value})} className="w-full p-2 border rounded">
                    <option value="low">low</option>
                    <option value="normal">normal</option>
                    <option value="high">high</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-2 text-xs">Status</label>
                  <input value={form.status || ''} onChange={(e)=>setForm({...form, status:e.target.value})} placeholder="pending/in-progress/done" className="w-full p-2 border rounded" />
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
