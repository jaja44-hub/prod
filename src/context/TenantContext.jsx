import React, { createContext, useContext, useEffect, useState } from 'react';

const TenantContext = createContext({ tenantReady: false, tenantId: null });

export function TenantProvider({ children, onTenantReady }) {
  const [tenantId, setTenantId] = useState(null);
  const [tenantReady, setTenantReady] = useState(false);

  useEffect(() => {
    const envTenant = import.meta.env?.VITE_TENANT_ID || null;
    const local = (typeof window !== 'undefined' && window.localStorage?.getItem('tenantId')) || null;
    const t = envTenant || local || 'production';
    setTenantId(t);
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('tenantId', t);
    }
    if (typeof onTenantReady === 'function') onTenantReady(t);
    setTenantReady(true);
  }, [onTenantReady]);

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
