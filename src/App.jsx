import React, { useState } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import ProductionLanding from './views/ProductionLanding';
import DemoManufacturing from './views/DemoManufacturing';
import Inventory from './views/Inventory';
import WorkOrders from './views/WorkOrders';
import Procurement from './views/Procurement';
import Purchasing from './views/Purchasing';
import Suppliers from './views/Suppliers';
import QC from './views/QC';
import Logistics from './views/Logistics';
import FinanceDocs from './views/FinanceDocs';
import Sales from './views/Sales';
import Orders from './views/Orders';
import Employees from './views/Employees';
import Reports from './views/Reports';
import Payroll from './views/Payroll';
import Barcode from './views/Barcode';
import ProductionDashboard from './views/ProductionDashboard';

const groups = [
  { title: 'Overview', items: [ { to: '/', label: 'Production Home' }, { to: '/production-dashboard', label: 'Dashboard' }, { to: '/demo/manufacturing', label: 'Demo' } ] },
  { title: 'Operations', items: [ { to: '/inventory', label: 'Inventory' }, { to: '/work-orders', label: 'Work Orders' }, { to: '/barcode', label: 'Barcode/QR' } ] },
  { title: 'Procurement', items: [ { to: '/procurement', label: 'Procurement' }, { to: '/purchasing', label: 'Create PO' }, { to: '/suppliers', label: 'Suppliers' } ] },
  { title: 'Sales & Orders', items: [ { to: '/sales', label: 'Sales' }, { to: '/orders', label: 'Orders' } ] },
  { title: 'Quality & Logistics', items: [ { to: '/qc', label: 'Quality Control' }, { to: '/logistics', label: 'Logistics' } ] },
  { title: 'Finance & People', items: [ { to: '/finance-docs', label: 'Finance Docs' }, { to: '/payroll', label: 'Payroll' }, { to: '/employees', label: 'Employees' } ] },
  { title: 'Reports', items: [ { to: '/reports', label: 'Reports' } ] },
];

function Sidebar({ open, onClose }) {
  return (
    <aside style={{
      width: open ? 260 : 0,
      overflow: 'hidden',
      transition: 'width .18s ease',
      background: '#fff',
      borderRight: '1px solid #eee',
      paddingLeft: open ? 12 : 0,
      paddingRight: open ? 12 : 0,
    }}>
      <div style={{ padding: 12 }}>
        <h3 style={{ margin: '6px 0' }}>Production</h3>
        {groups.map(g => (
          <div key={g.title} style={{ marginTop: 12 }}>
            <div style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>{g.title}</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {g.items.map(i => (
                <li key={i.to} style={{ marginBottom: 6 }}>
                  <Link to={i.to} onClick={onClose} style={{ color: '#111', textDecoration: 'none' }}>{i.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </aside>
  );
}

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid #eee' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button onClick={() => setSidebarOpen(s => !s)} aria-label="Toggle sidebar" style={{ padding: 8 }}>☰</button>
            <Link to="/" style={{ fontWeight: 700, textDecoration: 'none', color: '#111' }}>Addis Crown — Production</Link>
          </div>
          <div style={{ color: '#666' }}>Production preview</div>
        </header>

        <main style={{ padding: 16 }}>
          <Routes>
            <Route path="/" element={<ProductionLanding />} />
            <Route path="/production-dashboard" element={<ProductionDashboard />} />
            <Route path="/demo/manufacturing" element={<DemoManufacturing />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/work-orders" element={<WorkOrders />} />
            <Route path="/procurement" element={<Procurement />} />
            <Route path="/purchasing" element={<Purchasing />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/qc" element={<QC />} />
            <Route path="/logistics" element={<Logistics />} />
            <Route path="/finance-docs" element={<FinanceDocs />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/employees" element={<Employees />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/payroll" element={<Payroll />} />
            <Route path="/barcode" element={<Barcode />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
