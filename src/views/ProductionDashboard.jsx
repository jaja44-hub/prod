import React from 'react';

export default function ProductionDashboard() {
  return (
    <div>
      <h2>Production Dashboard</h2>
      <p style={{ color: 'var(--text-muted)' }}>KPIs: output, OEE, on-time delivery, low-stock alerts (mock).</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginTop: 12 }}>
        <div className="card">
          <h4>Daily Output</h4>
          <div style={{ fontSize: 28, fontWeight: 700 }}>1,240</div>
          <div style={{ color: 'var(--text-muted)' }}>Units produced today</div>
        </div>
        <div className="card">
          <h4>OEE (Est.)</h4>
          <div style={{ fontSize: 28, fontWeight: 700 }}>72%</div>
          <div style={{ color: 'var(--text-muted)' }}>Overall equipment effectiveness</div>
        </div>
        <div className="card">
          <h4>Low Stock Alerts</h4>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--accent)' }}>3</div>
          <div style={{ color: 'var(--text-muted)' }}>Items below reorder point</div>
        </div>
      </div>
    </div>
  );
}
