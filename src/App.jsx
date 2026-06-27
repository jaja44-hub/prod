import React, { useEffect } from 'react';
import {
  Routes,
  Route,
  useLocation
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

function App() {

  const location = useLocation();

  useEffect(() => {
    document.querySelector('html').style.scrollBehavior = 'auto'
    window.scroll({ top: 0 })
    document.querySelector('html').style.scrollBehavior = ''
  }, [location.pathname]); // triggered on route change

  return (
    <Routes>
      {/* Public routes (no header/sidebar) */}
      <Route exact path="/" element={<LoginPage />} />

      {/* Protected routes use MainLayout which provides Header + Sidebar */}
      <Route element={<MainLayout />}>
        <Route path='/Dashboard' element={<Dashboard />}/>
        <Route path='/inventory' element={<Inventory />} />
        <Route path='/inventory/new' element={<ItemDetail />} />
        <Route path='/inventory/:id' element={<ItemDetail />} />
        <Route path='/work-orders' element={<WorkOrders />} />
        <Route path='/work-orders/new' element={<WorkOrderDetail />} />
        <Route path='/work-orders/:id' element={<WorkOrderDetail />} />
        <Route path='/sales' element={<Sales />} />
        <Route path='/purchases' element={<PurchaseOrders />} />
        <Route path='/crm' element={<Customers />} />
        <Route path='/customers' element={<Customers />} />
        <Route path='/hr' element={<Employees />} />
        <Route path='/finance' element={<Accounts />} />
        
        {/* API Connection Test Route */}
        <Route path='/test' element={<OdooTest />} />
      </Route>
    </Routes>
  );
}

export default App;

