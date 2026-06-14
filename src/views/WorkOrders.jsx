import { useEffect, useState } from 'react';
import { WorkOrderService } from '../../src/services/WorkOrderService';
import { useTenant } from '../context/TenantContext';

export default function WorkOrders() {
  const [list, setList] = useState([]);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');

  const refresh = async () => {
    const res = await WorkOrderService.listWorkOrders();
    setList(res || []);
  };

  const { tenantReady } = useTenant();

  useEffect(() => {
    refresh();
  }, [tenantReady]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    await WorkOrderService.createWorkOrder({ title: title.trim(), description: desc.trim() });
    setTitle('');
    setDesc('');
    await refresh();
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Work Orders</h2>
      <p>Scaffolded list of work orders.</p>

      <form onSubmit={handleCreate} style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Work order title" style={{ padding: 8, flex: 1 }} />
          <button type="submit" style={{ padding: '8px 12px' }}>Create</button>
        </div>
        <div style={{ marginTop: 8 }}>
          <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Description (optional)" style={{ width: '100%', padding: 8, minHeight: 80 }} />
        </div>
      </form>

      <ul>
        {list.map((wo) => (
          <li key={wo.id || wo.reference}>{wo.reference} — {wo.title} — {wo.status}</li>
        ))}
      </ul>
    </div>
  );
}
