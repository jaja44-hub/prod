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
import ItemDetail from './pages/ItemDetail';
import WorkOrderDetail from './pages/WorkOrderDetail';
import MainLayout from './layouts/MainLayout';

function App() {

  const location = useLocation();

  useEffect(() => {
    document.querySelector('html').style.scrollBehavior = 'auto'
    window.scroll({ top: 0 })
    document.querySelector('html').style.scrollBehavior = ''
  }, [location.pathname]); // triggered on route change

  return (
    <MainLayout>
      <Routes>
        <Route exact path="/" element={<LoginPage />} />
        <Route path='/Dashboard' element={<Dashboard />}/>
        <Route path='/inventory' element={<Inventory />} />
        <Route path='/inventory/new' element={<ItemDetail />} />
        <Route path='/inventory/:id' element={<ItemDetail />} />
        <Route path='/work-orders' element={<WorkOrders />} />
        <Route path='/work-orders/new' element={<WorkOrderDetail />} />
        <Route path='/work-orders/:id' element={<WorkOrderDetail />} />
      </Routes>
    </MainLayout>
  );
}

export default App;

