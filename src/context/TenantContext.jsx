import React, { createContext, useContext, useEffect, useState } from 'react';

const TenantContext = createContext({ tenantReady: false, tenantId: null });

export function TenantProvider({ children }) {
  const [tenantId, setTenantId] = useState(null);
  const [tenantReady, setTenantReady] = useState(false);

  useEffect(() => {
    // Minimal production behavior: prefer Vite env, fallback to localStorage
    const envTenant = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_TENANT_ID) ? import.meta.env.VITE_TENANT_ID : null;
    const local = (typeof window !== 'undefined' && window.localStorage && window.localStorage.getItem('tenantId')) || null;
    const t = envTenant || local || 'production';
    setTenantId(t);
    if (typeof window !== 'undefined' && window.localStorage) window.localStorage.setItem('tenantId', t);
    setTenantReady(true);
  }, []);

  return (
    <TenantContext.Provider value={{ tenantReady, tenantId }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  return useContext(TenantContext);
}

export default TenantContext;
