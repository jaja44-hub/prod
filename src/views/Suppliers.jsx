import React from 'react';
import { Link } from 'react-router-dom';

const SUPPLIERS = [
  { id: 'V-3001', name: 'Alpha Metals', contact: 'info@alpha.example', rating: 4.5 },
  { id: 'V-3002', name: 'GlassPro', contact: 'sales@glasspro.example', rating: 4.2 },
];

export default function Suppliers() {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Suppliers</h2>
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>Supplier directory and ratings (mock).</p>
        </div>
        <div>
          <Link to="/purchasing" className="btn-primary">New PO</Link>
        </div>
      </div>

      <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
        {SUPPLIERS.map(s => (
          <div key={s.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 700 }}>{s.name} <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>({s.id})</span></div>
              <div style={{ color: 'var(--text-muted)' }}>{s.contact}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div>Rating: {s.rating}</div>
              <div style={{ marginTop: 6 }}><Link to="/procurement">View</Link></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
