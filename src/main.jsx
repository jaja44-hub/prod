import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { TenantProvider } from './context/TenantContext';
import * as GW from './services/ServiceGateway';
import './css/style.css';

function Main() {
  return (
    <BrowserRouter>
      <TenantProvider onTenantReady={(tenantId) => GW.setActiveTenant(tenantId)}>
        <App />
      </TenantProvider>
    </BrowserRouter>
  );
}

createRoot(document.getElementById('root')).render(<Main />);
