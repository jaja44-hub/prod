import React from 'react';
import { Link } from 'react-router-dom';
import DemoManufacturing from './DemoManufacturing';

export default function ProductionLanding() {
  return (
    <div style={{ padding: 28, maxWidth: 1100, margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0 }}>Production ERP — Manufacturing & Inventory</h1>
          <p style={{ marginTop: 8, color: 'var(--text-muted)' }}>
            Production planning, inventory control, procurement, quality and logistics — tailored ERP features for manufacturers.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link to="/login" className="btn-primary">Sign In</Link>
          <Link to="/demo/manufacturing" className="btn-secondary">Try Demo</Link>
          <Link to="/onboarding?sector=manufacturing" className="btn-accent">Request Onboarding</Link>
        </div>
      </header>

      <section style={{ marginTop: 20, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <div className="card">
          <h3>Operations</h3>
          <p style={{ color: 'var(--text-muted)' }}>Inventory, work orders, production scheduling and shop floor tracking.</p>
          <div style={{ marginTop: 8 }}><Link to="/inventory">Open Inventory</Link></div>
        </div>
        <div className="card">
          <h3>Procurement & Suppliers</h3>
          <p style={{ color: 'var(--text-muted)' }}>Purchase orders, supplier management and receiving.</p>
          <div style={{ marginTop: 8 }}><Link to="/procurement">Procurement</Link></div>
        </div>
        <div className="card">
          <h3>Quality & Compliance</h3>
          <p style={{ color: 'var(--text-muted)' }}>QC checks, inspection reports and traceability.</p>
          <div style={{ marginTop: 8 }}><Link to="/qc">Quality Control</Link></div>
        </div>
      </section>

      <section style={{ marginTop: 18, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <div className="card">
          <h3>Logistics & Warehousing</h3>
          <p style={{ color: 'var(--text-muted)' }}>Stock locations, transfers, dispatch and shipping labels.</p>
          <div style={{ marginTop: 8 }}><Link to="/logistics">Logistics</Link></div>
        </div>
        <div className="card">
          <h3>Finance & Documents</h3>
          <p style={{ color: 'var(--text-muted)' }}>Invoices, supplier invoices and financial documents integration.</p>
          <div style={{ marginTop: 8 }}><Link to="/finance-docs">Finance Docs</Link></div>
        </div>
        <div className="card">
          <h3>People & Roles</h3>
          <p style={{ color: 'var(--text-muted)' }}>Employee management, roles and access control.</p>
          <div style={{ marginTop: 8 }}><Link to="/employees">Employees</Link></div>
        </div>
      </section>

      <section style={{ marginTop: 24 }}>
        <h3>Demo Preview</h3>
        <DemoManufacturing />
      </section>
    </div>
  );
}
