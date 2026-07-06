import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { WorkOrderService } from '../services/WorkOrderService';
import PageHeader from '../components/PageHeader';
import PageCard from '../components/PageCard';

export default function WorkOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', priority: 'normal', status: 'pending' });

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!id || id === 'new') return;
      setLoading(true);
      try {
        const data = await WorkOrderService.getWorkOrder(id);
        if (mounted && data) {
          setOrder(data);
          setForm({
            title: data.title || '',
            description: data.description || '',
            priority: data.priority || 'normal',
            status: data.status || 'pending',
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [id]);

  async function submit(e) {
    e.preventDefault();
    try {
      if (id && id !== 'new') {
        await WorkOrderService.updateWorkOrder(id, form);
      } else {
        const created = await WorkOrderService.createWorkOrder(form);
        navigate(`/work-orders/${created.id}`);
        return;
      }
      const refreshed = await WorkOrderService.getWorkOrder(id);
      setOrder(refreshed);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <section className="max-w-3xl">
      <PageHeader
        title={id === 'new' ? 'Create Work Order' : `Work Order ${order?.reference || ''}`}
        subtitle="Manage specific workshop floor settings, priority, and completion logs."
      />

      <PageCard>
        {loading ? (
          <div className="flex items-center justify-center py-12 text-gray-500">
            Loading details...
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900 focus:outline-none focus:border-violet-500 dark:text-gray-150"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900 focus:outline-none focus:border-violet-500 dark:text-gray-150"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Priority</label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900 focus:outline-none focus:border-violet-500 dark:text-gray-150"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Status</label>
                <input
                  type="text"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900 focus:outline-none focus:border-violet-500 dark:text-gray-150"
                />
              </div>
            </div>

            <div className="flex justify-end items-center gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
              <button
                type="button"
                onClick={() => navigate('/work-orders')}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
              >
                Save
              </button>
            </div>
          </form>
        )}
      </PageCard>
    </section>
  );
}
