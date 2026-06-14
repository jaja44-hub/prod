import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Purchasing() {
  const [form, setForm] = useState({ vendor: '', items: '', total: '' });

  function submit(e) {
    e.preventDefault();
    alert(`Mock PO created for ${form.vendor}: ETB ${form.total}`);
    setForm({ vendor: '', items: '', total: '' });
  }

  return (
    <div>
      <h2>Create Purchase Order</h2>
      <p style={{ color: 'var(--text-muted)' }}>Simple mock form to create a purchase order.</p>
      <form onSubmit={submit} style={{ display: 'grid', gap: 8, maxWidth: 600 }}>
        <input placeholder="Vendor name" value={form.vendor} onChange={e => setForm(f => ({ ...f, vendor: e.target.value }))} />
        <textarea placeholder="Items (one per line)" value={form.items} onChange={e => setForm(f => ({ ...f, items: e.target.value }))} />
        <input placeholder="Total (ETB)" value={form.total} onChange={e => setForm(f => ({ ...f, total: e.target.value }))} />
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-primary" type="submit">Create PO</button>
          <Link to="/procurement" className="btn-secondary">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
