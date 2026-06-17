import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { WorkOrderService } from '../services/WorkOrderService'

export default function WorkOrderDetail(){
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [order, setOrder] = useState(null)
  const [form, setForm] = useState({ title: '', description: '', priority: 'normal', status: 'pending' })

  useEffect(()=>{
    let mounted = true
    async function load(){
      if (!id || id === 'new') return
      setLoading(true)
      const data = await WorkOrderService.getWorkOrder(id)
      if (mounted) {
        setOrder(data)
        setForm({ title: data?.title || '', description: data?.description || '', priority: data?.priority || 'normal', status: data?.status || 'pending' })
      }
      setLoading(false)
    }
    load()
    return ()=> (mounted = false)
  }, [id])

  async function submit(e){
    e.preventDefault()
    if (id && id !== 'new'){
      await WorkOrderService.updateWorkOrder(id, form)
    } else {
      const created = await WorkOrderService.createWorkOrder(form)
      navigate(`/work-orders/${created.id}`)
      return
    }
    const refreshed = await WorkOrderService.getWorkOrder(id)
    setOrder(refreshed)
  }

  return (
    <div className="p-4">
      <div className="bg-white dark:bg-gray-800 p-4 rounded shadow-sm max-w-3xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{id === 'new' ? 'Create Work Order' : `Work Order ${order?.reference || ''}`}</h2>
          <div>
            <button onClick={()=>navigate('/work-orders')} className="text-sm text-gray-500">Back</button>
          </div>
        </div>

        {loading ? (
          <p>Loading…</p>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className="block text-xs">Title</label>
              <input value={form.title} onChange={(e)=>setForm({...form, title:e.target.value})} className="w-full p-2 border rounded" />
            </div>
            <div>
              <label className="block text-xs">Description</label>
              <textarea value={form.description} onChange={(e)=>setForm({...form, description:e.target.value})} className="w-full p-2 border rounded" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs">Priority</label>
                <select value={form.priority} onChange={(e)=>setForm({...form, priority:e.target.value})} className="w-full p-2 border rounded">
                  <option value="low">low</option>
                  <option value="normal">normal</option>
                  <option value="high">high</option>
                </select>
              </div>
              <div>
                <label className="block text-xs">Status</label>
                <input value={form.status} onChange={(e)=>setForm({...form, status:e.target.value})} className="w-full p-2 border rounded" />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <button type="button" onClick={()=>navigate('/work-orders')} className="px-3 py-1 border rounded">Cancel</button>
              <button type="submit" className="px-3 py-1 bg-violet-600 text-white rounded">Save</button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
