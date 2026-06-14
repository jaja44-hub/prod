import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

const MOCK_ORDERS = [
  { id: 'ORD-1001', customer: 'Alem Builders', total: 12500, status: 'confirmed', date: '2026-06-10' },
  { id: 'ORD-1002', customer: 'Beta Constr.', total: 5400, status: 'pending', date: '2026-06-11' },
  { id: 'ORD-1003', customer: 'Gamma Real Estate', total: 9200, status: 'shipped', date: '2026-06-09' },
];

export default function Sales() {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = useMemo(() => {
    return MOCK_ORDERS.filter(o => {
      if (statusFilter !== 'all' && o.status !== statusFilter) return false;
      if (!query) return true;
      return o.customer.toLowerCase().includes(query.toLowerCase()) || o.id.toLowerCase().includes(query.toLowerCase());
    });
  }, [query, statusFilter]);

  const totalToday = MOCK_ORDERS.reduce((s, o) => s + o.total, 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Sales</h2>
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>Customer orders, quotations and invoices — mock sales console.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link to="/orders" className="btn-secondary">All Orders</Link>
          <Link to="/orders" className="btn-primary">Create Order</Link>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 14 }}>
        <div className="card" style={{ flex: 1 }}>
          <h4>Open Orders</h4>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{MOCK_ORDERS.length}</div>
        </div>
        <div className="card" style={{ flex: 1 }}>
          <h4>Revenue (sample)</h4>
          <div style={{ fontSize: 24, fontWeight: 700 }}>ETB {totalToday.toLocaleString()}</div>
        </div>
        <div className="card" style={{ flex: 1 }}>
          <h4>Last Order</h4>
          <div style={{ fontSize: 18 }}>{MOCK_ORDERS[0].id}</div>
          <div style={{ color: 'var(--text-muted)' }}>{MOCK_ORDERS[0].customer}</div>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input placeholder="Search orders or customers" value={query} onChange={e => setQuery(e.target.value)} />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="shipped">Shipped</option>
          </select>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: 8 }}>Order</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Customer</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Date</th>
              <th style={{ textAlign: 'right', padding: 8 }}>Total (ETB)</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(o => (
              <tr key={o.id}>
                <td style={{ padding: 8 }}><Link to={`/orders`}>{o.id}</Link></td>
                <td style={{ padding: 8 }}>{o.customer}</td>
                <td style={{ padding: 8 }}>{o.date}</td>
                <td style={{ padding: 8, textAlign: 'right' }}>{o.total.toLocaleString()}</td>
                <td style={{ padding: 8 }}>{o.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
