import React, { useEffect } from 'react';
import {
  Routes,
  Route,
  useLocation,
  Navigate,
} from 'react-router-dom';

import './css/style.css';
import './charts/ChartjsConfig';

// Import pages
import Dashboard from './pages/Dashboard';
import LoginPage from './pages/login';
import Inventory from './pages/Inventory';
import WorkOrders from './pages/WorkOrders';
import Sales from './pages/Sales';
import ItemDetail from './pages/ItemDetail';
import WorkOrderDetail from './pages/WorkOrderDetail';
import PurchaseOrders from './pages/PurchaseOrders';
import Customers from './pages/Customers';
import Employees from './pages/Employees';
import Accounts from './pages/Accounts';
import MainLayout from './layouts/MainLayout';
import OdooTest from './components/OdooTest';
import RoleGuard from './components/RoleGuard';
import ComingSoon from './pages/ComingSoon';

function App() {
  const location = useLocation();

  useEffect(() => {
    document.querySelector('html').style.scrollBehavior = 'auto'
    window.scroll({ top: 0 })
    document.querySelector('html').style.scrollBehavior = ''
  }, [location.pathname]);

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Navigate replace to="/login" />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Protected routes — all inside MainLayout */}
      <Route element={<MainLayout />}>
        {/* Dashboard — all roles can see, content adapts by role */}
        <Route path='/dashboard' element={<Dashboard />} />

        {/* Inventory — CEO & Warehouse Head */}
        <Route path='/inventory' element={<RoleGuard><Inventory /></RoleGuard>} />
        <Route path='/inventory/new' element={<RoleGuard><ItemDetail /></RoleGuard>} />
        <Route path='/inventory/:id' element={<RoleGuard><ItemDetail /></RoleGuard>} />

        {/* Manufacturing — CEO & Warehouse Head */}
        <Route path='/work-orders' element={<RoleGuard><WorkOrders /></RoleGuard>} />
        <Route path='/work-orders/new' element={<RoleGuard><WorkOrderDetail /></RoleGuard>} />
        <Route path='/work-orders/:id' element={<RoleGuard><WorkOrderDetail /></RoleGuard>} />

        {/* Sales & CRM — CEO & Sales Head */}
        <Route path='/sales' element={<RoleGuard><Sales /></RoleGuard>} />
        <Route path='/crm' element={<RoleGuard><Customers /></RoleGuard>} />
        <Route path='/customers' element={<RoleGuard><Customers /></RoleGuard>} />

        {/* Procurement — CEO & Warehouse Head */}
        <Route path='/purchases' element={<RoleGuard><PurchaseOrders /></RoleGuard>} />

        {/* HR — CEO & HR Head */}
        <Route path='/hr' element={<RoleGuard><Employees /></RoleGuard>} />

        {/* Finance — CEO only */}
        <Route path='/finance' element={<RoleGuard><Accounts /></RoleGuard>} />

        {/* Dev/test */}
        <Route path='/test' element={<OdooTest />} />

        {/* Catch-all for unbuilt modules like /qc, /logistics, /payroll, etc. */}
        <Route path='*' element={<RoleGuard><ComingSoon /></RoleGuard>} />
      </Route>
    </Routes>
  );
}

export default App;
