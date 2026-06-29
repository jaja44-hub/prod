import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { canAccess } from '../lib/rbac';
import { getPrincipal, isCeo, canViewModule } from '../lib/policy';

function getModuleId(pathname) {
  if (pathname.startsWith('/finance') || pathname.startsWith('/invoices') || pathname.startsWith('/reports')) {
    return 'finance';
  }
  if (pathname.startsWith('/inventory') || pathname.startsWith('/work-orders')) {
    return 'inventory';
  }
  if (pathname.startsWith('/sales') || pathname.startsWith('/crm') || pathname.startsWith('/customers') || pathname.startsWith('/orders')) {
    return 'sales';
  }
  if (pathname.startsWith('/purchases') || pathname.startsWith('/suppliers')) {
    return 'purchase';
  }
  if (pathname.startsWith('/hr') || pathname.startsWith('/employees') || pathname.startsWith('/payroll')) {
    return 'hr';
  }
  if (pathname === '/dashboard' || pathname.startsWith('/dashboard')) {
    return 'dashboard';
  }
  return null;
}

/**
 * Wraps any route. If the logged-in user doesn't have access,
 * redirects to /dashboard. CEOs always pass through.
 */
export default function RoleGuard({ children }) {
  const { userProfile, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;

  const principal = getPrincipal(userProfile);
  const role = principal?.role;
  const moduleId = getModuleId(location.pathname);

  if (isCeo(principal)) return children;

  if (!role || !canAccess(role, location.pathname) || (moduleId && !canViewModule(principal, moduleId))) {
    return <Navigate replace to="/dashboard" />;
  }

  return children;
}
