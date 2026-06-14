import React from 'react';

export default function QC() {
  const checklist = [
    { id: 'QC-1', title: 'Dimensional Check', status: 'pass' },
    { id: 'QC-2', title: 'Surface Finish', status: 'pass' },
  ];

  return (
    <div>
      <h2>Quality Control</h2>
      <p style={{ color: 'var(--text-muted)' }}>QC checklists and inspection reports (mock).</p>
      <div style={{ marginTop: 12 }}>
        {checklist.map(c => (
          <div key={c.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', padding: 12 }}>
            <div>{c.title}</div>
            <div style={{ color: c.status === 'pass' ? 'green' : 'orange' }}>{c.status}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
