import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { InventoryService } from '../services/InventoryService'

export default function ItemDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [item, setItem] = useState(null)
  const [form, setForm] = useState({ sku: '', name: '', quantity: 0, unit: 'pcs', location: '', description: '' })

  useEffect(() => {
    let mounted = true
    async function load() {
      if (!id || id === 'new') return
      setLoading(true)
      const data = await InventoryService.getItem(id)
      if (mounted) {
        setItem(data)
        setForm({ sku: data?.sku || '', name: data?.name || '', quantity: data?.quantity || 0, unit: data?.unit || 'pcs', location: data?.location || '', description: data?.description || '' })
      }
      setLoading(false)
    }
    load()
    return () => (mounted = false)
  }, [id])

  async function submit(e) {
    e.preventDefault()
    if (id && id !== 'new') {
      await InventoryService.updateItem(id, form)
    } else {
      const created = await InventoryService.createItem(form)
      navigate(`/inventory/${created.id}`)
      return
    }
    // reload
    const refreshed = await InventoryService.getItem(id)
    setItem(refreshed)
  }

  return (
    <div className="p-4">
      <div className="bg-white dark:bg-gray-800 p-4 rounded shadow-sm max-w-3xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{id === 'new' ? 'Create Item' : `Item ${item?.sku || ''}`}</h2>
          <div>
            <button onClick={() => navigate('/inventory')} className="text-sm text-gray-500">Back</button>
          </div>
        </div>

        {loading ? (
          <p>Loading…</p>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className="block text-xs">SKU</label>
              <input value={form.sku} onChange={(e)=>setForm({...form, sku:e.target.value})} className="w-full p-2 border rounded" />
            </div>
            <div>
              <label className="block text-xs">Name</label>
              <input value={form.name} onChange={(e)=>setForm({...form, name:e.target.value})} className="w-full p-2 border rounded" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs">Qty</label>
                <input type="number" value={form.quantity} onChange={(e)=>setForm({...form, quantity: Number(e.target.value)})} className="w-full p-2 border rounded" />
              </div>
              <div>
                <label className="block text-xs">Unit</label>
                <input value={form.unit} onChange={(e)=>setForm({...form, unit:e.target.value})} className="w-full p-2 border rounded" />
              </div>
              <div>
                <label className="block text-xs">Location</label>
                <input value={form.location} onChange={(e)=>setForm({...form, location:e.target.value})} className="w-full p-2 border rounded" />
              </div>
            </div>
            <div>
              <label className="block text-xs">Description</label>
              <textarea value={form.description} onChange={(e)=>setForm({...form, description:e.target.value})} className="w-full p-2 border rounded" />
            </div>
            <div className="flex justify-end space-x-2">
              <button type="button" onClick={() => navigate('/inventory')} className="px-3 py-1 border rounded">Cancel</button>
              <button type="submit" className="px-3 py-1 bg-violet-600 text-white rounded">Save</button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
