import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { InventoryService } from '../services/InventoryService';
import { WorkOrderService } from '../services/WorkOrderService';

const staticInventory = [
  { id: '1', sku: 'SKU-1001', name: 'Widget A', quantity: 100 },
  { id: '2', sku: 'SKU-1002', name: 'Widget B', quantity: 50 },
];

const staticWorkOrders = [
  { id: 'w1', reference: 'WO-001', title: 'Assemble Widget A', status: 'open' },
  { id: 'w2', reference: 'WO-002', title: 'Assemble Widget B', status: 'open' },
];

export default function DemoManufacturing() {
  const [items, setItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Use production-submodule services (they internally handle tenant scoping)
        const [inv, wo] = await Promise.all([
          InventoryService.listItems(),
          WorkOrderService.listWorkOrders(),
        ]);
        if (cancelled) return;
        const invList = (inv && inv.length) ? inv : staticInventory;
        const woList = (wo && wo.length) ? wo : staticWorkOrders;
        setItems(invList);
        setOrders(woList);
      } catch (err) {
        // Services unavailable — fall back to static demo
        setItems(staticInventory);
        setOrders(staticWorkOrders);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h2>Manufacturing Demo</h2>
      <p style={{ color: 'var(--text-muted)' }}>
        Lightweight demo preview of the Manufacturing sector: inventory and simple work order flows.
      </p>

      {loading ? (
        <p>Loading demo data…</p>
      ) : (
        <>
          <section style={{ marginTop: 18 }}>
            <h3>Inventory</h3>
            <ul>
              {items.map(i => <li key={i.id}>{i.name} — {i.sku} — {i.quantity ?? i.qty ?? i.quantity}</li>)}
            </ul>
            <Link to="/inventory" style={{ display: 'inline-block', marginTop: 8 }}>
              Open full Inventory (login required)
            </Link>
          </section>

          <section style={{ marginTop: 18 }}>
            <h3>Work Orders</h3>
            <ul>
              {orders.map(o => <li key={o.id}>{o.reference} — {o.title} — {o.status}</li>)}
            </ul>
            <Link to="/work-orders" style={{ display: 'inline-block', marginTop: 8 }}>
              Open Work Orders (login required)
            </Link>
          </section>
        </>
      )}
    </div>
  );
}
