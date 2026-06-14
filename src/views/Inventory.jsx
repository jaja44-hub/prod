import { useEffect, useState } from 'react';
import { InventoryService } from '../services/InventoryService';
import { useTenant } from '../context/TenantContext';

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [qty, setQty] = useState(0);

  const { tenantReady } = useTenant();

  useEffect(() => {
    (async () => {
      const res = await InventoryService.listItems();
      setItems(res || []);
    })();
  }, [tenantReady]);

  const refresh = async () => {
    const res = await InventoryService.listItems();
    setItems(res || []);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    await InventoryService.createItem({ name: name.trim(), sku: sku.trim(), quantity: Number(qty || 0) });
    setName(''); setSku(''); setQty(0);
    await refresh();
  };
  return (
    <div style={{ padding: 20 }}>
      <h2>Inventory</h2>
      <p>Simple inventory list (production scaffold).</p>
      <ul>
       <form onSubmit={handleCreate} style={{ marginBottom: 20 }}>
         <div style={{ display: 'flex', gap: 8 }}>
           <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Item name" style={{ padding: 8, flex: 2 }} />
           <input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="SKU" style={{ padding: 8, flex: 1 }} />
           <input type="number" value={qty} onChange={(e) => setQty(e.target.value)} placeholder="Qty" style={{ padding: 8, width: 100 }} />
           <button type="submit" style={{ padding: '8px 12px' }}>Create</button>
         </div>
       </form>
        {items.map((it) => (
          <li key={it.id || it.reference}>{it.name || it.sku || 'Unnamed'} — {it.quantity}</li>
        ))}
      </ul>
    </div>
  );
}
