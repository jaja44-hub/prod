import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

const SAMPLE = [
  { id: 'ORD-1001', customer: 'Alem Builders', status: 'confirmed', due: '2026-06-18' },
  { id: 'ORD-1002', customer: 'Beta Constr.', status: 'pending', due: '2026-06-21' },
  { id: 'ORD-1003', customer: 'Gamma RE', status: 'shipped', due: '2026-06-12' },
];

export default function Orders() {
  const [filter, setFilter] = useState('all');
  const list = useMemo(() => SAMPLE.filter(o => filter === 'all' || o.status === filter), [filter]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Orders</h2>
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>Order fulfillment and delivery scheduling (mock).</p>
        </div>
        <div>
          <Link to="/orders" className="btn-primary">New Order</Link>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <label style={{ marginRight: 8 }}>Status:</label>
        <select value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="shipped">Shipped</option>
        </select>
      </div>

      <div style={{ marginTop: 12 }}>
        <table style={{ width: '100%' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: 8 }}>Order</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Customer</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Due</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {list.map(o => (
              <tr key={o.id}>
                <td style={{ padding: 8 }}><Link to={`/orders`}>{o.id}</Link></td>
                <td style={{ padding: 8 }}>{o.customer}</td>
                <td style={{ padding: 8 }}>{o.due}</td>
                <td style={{ padding: 8 }}>{o.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
