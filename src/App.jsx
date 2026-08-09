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
import SalesOrderDetail from './pages/SalesOrderDetail';
import ItemDetail from './pages/ItemDetail';
import WorkOrderDetail from './pages/WorkOrderDetail';
import PurchaseOrders from './pages/PurchaseOrders';
import PurchaseOrderDetail from './pages/PurchaseOrderDetail';
import Customers from './pages/Customers';
import Vendors from './pages/Vendors';
import Employees from './pages/Employees';
import Accounts from './pages/Accounts';
import MainLayout from './layouts/MainLayout';
import RoleGuard, { PlatformAdminGuard } from './components/RoleGuard';
import ComingSoon from './pages/ComingSoon';
import PlatformAdmin from './pages/PlatformAdmin';
import TenantSetup from './pages/TenantSetup'
import Approvals from './pages/Approvals';
import BarcodeMVP from './pages/Barcode';
import QCModule from './pages/QC';
import Analytics from './pages/Analytics';
import WarehouseDashboard from './pages/WarehouseDashboard';
import WarehouseReceipts from './pages/WarehouseReceipts';
import FinanceInvoices from './pages/FinanceInvoices';
import FinanceReports from './pages/FinanceReports';
import FinancialDocuments from './pages/FinancialDocuments';
import VATReturns from './pages/VATReturns';
import PAYECalculation from './pages/PAYECalculation';
import TaxReconciliation from './pages/TaxReconciliation';
import BudgetVsActual from './pages/BudgetVsActual';
import SupplierPerformance from './pages/SupplierPerformance';
import CashFlowForecast from './pages/CashFlowForecast';

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
        <Route path='/warehouse' element={<RoleGuard><WarehouseDashboard /></RoleGuard>} />
        <Route path='/warehouse/receipts' element={<RoleGuard><WarehouseReceipts /></RoleGuard>} />

        {/* Manufacturing — CEO & Warehouse Head */}
        <Route path='/work-orders' element={<RoleGuard><WorkOrders /></RoleGuard>} />
        <Route path='/work-orders/new' element={<RoleGuard><WorkOrderDetail /></RoleGuard>} />
        <Route path='/work-orders/:id' element={<RoleGuard><WorkOrderDetail /></RoleGuard>} />

        {/* Sales & CRM — CEO & Sales Head */}
        <Route path='/sales' element={<RoleGuard><Sales /></RoleGuard>} />
        <Route path='/sales/new' element={<RoleGuard><SalesOrderDetail /></RoleGuard>} />
        <Route path='/sales/:id' element={<RoleGuard><SalesOrderDetail /></RoleGuard>} />
        <Route path='/crm' element={<RoleGuard><Customers /></RoleGuard>} />
        <Route path='/customers' element={<RoleGuard><Customers /></RoleGuard>} />

        {/* Procurement — CEO & Warehouse Head */}
        <Route path='/purchases' element={<RoleGuard><PurchaseOrders /></RoleGuard>} />
        <Route path='/purchases/new' element={<RoleGuard><PurchaseOrderDetail /></RoleGuard>} />
        <Route path='/purchases/:id' element={<RoleGuard><PurchaseOrderDetail /></RoleGuard>} />
        <Route path='/suppliers' element={<RoleGuard><Vendors /></RoleGuard>} />
        <Route path='/orders' element={<RoleGuard><Sales /></RoleGuard>} />

        {/* HR — CEO & HR Head */}
        <Route path='/hr' element={<RoleGuard><Employees /></RoleGuard>} />
        <Route path='/employees' element={<RoleGuard><Employees /></RoleGuard>} />
        <Route path='/payroll' element={<RoleGuard><Employees /></RoleGuard>} />

        {/* Finance — CEO only */}
        <Route path='/finance' element={<RoleGuard><Accounts /></RoleGuard>} />
        <Route path='/invoices' element={<RoleGuard><FinanceInvoices /></RoleGuard>} />
        <Route path='/reports' element={<RoleGuard><FinanceReports /></RoleGuard>} />
        <Route path='/finance/documents' element={<RoleGuard><FinancialDocuments /></RoleGuard>} />
        <Route path='/finance/vat' element={<RoleGuard><VATReturns /></RoleGuard>} />
        <Route path='/finance/paye' element={<RoleGuard><PAYECalculation /></RoleGuard>} />
        <Route path='/finance/tax' element={<RoleGuard><TaxReconciliation /></RoleGuard>} />
        <Route path='/finance/budget' element={<RoleGuard><BudgetVsActual /></RoleGuard>} />
        <Route path='/finance/suppliers' element={<RoleGuard><SupplierPerformance /></RoleGuard>} />
        <Route path='/finance/cashflow' element={<RoleGuard><CashFlowForecast /></RoleGuard>} />

        {/* Platform & Tenant Admin Plane */}
        <Route path='/platform-admin' element={<PlatformAdminGuard><PlatformAdmin /></PlatformAdminGuard>} />
        <Route path='/platform-admin/tenants' element={<PlatformAdminGuard><PlatformAdmin /></PlatformAdminGuard>} />
        <Route path='/admin/setup' element={<RoleGuard><TenantSetup /></RoleGuard>} />
        <Route path='/approvals' element={<RoleGuard><Approvals /></RoleGuard>} />

        {/* Operations & Analytics */}
        <Route path='/barcode' element={<RoleGuard><BarcodeMVP /></RoleGuard>} />
        <Route path='/qc' element={<RoleGuard><QCModule /></RoleGuard>} />
        <Route path='/analytics' element={<RoleGuard><Analytics /></RoleGuard>} /> 

        {/* Catch-all for unbuilt modules like /qc, /logistics, /payroll, etc. */}
        <Route path='*' element={<RoleGuard><ComingSoon /></RoleGuard>} />
      </Route>
    </Routes>
  );
}

export default App;
