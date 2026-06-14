import React from 'react';
import { Link } from 'react-router-dom';

const MOCK_POS = [
  { id: 'PO-2001', vendor: 'Alpha Metals', status: 'open', total: 42000, date: '2026-06-05' },
  { id: 'PO-2002', vendor: 'GlassPro', status: 'received', total: 15000, date: '2026-06-02' },
];

export default function Procurement() {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Procurement</h2>
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>Vendor management, purchase orders and receiving (mock).</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link to="/purchasing" className="btn-primary">New Purchase Order</Link>
          <Link to="/suppliers" className="btn-secondary">Suppliers</Link>
        </div>
      </div>

      <section style={{ marginTop: 14 }}>
        <h4>Recent Purchase Orders</h4>
        <div style={{ display: 'grid', gap: 8 }}>
          {MOCK_POS.map(po => (
            <div key={po.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700 }}>{po.id} — {po.vendor}</div>
                <div style={{ color: 'var(--text-muted)' }}>{po.date} • ETB {po.total.toLocaleString()}</div>
              </div>
              <div style={{ color: po.status === 'open' ? 'var(--accent)' : 'var(--text-muted)' }}>{po.status}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
