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
 * Route guard: CEO passes; others need rbac route OR module policy match.
 */
export default function RoleGuard({ children }) {
  const { userProfile, currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;

  if (!currentUser) {
    return <Navigate replace to="/login" />;
  }

  const principal = getPrincipal(userProfile);
  const role = principal?.role;
  const moduleId = getModuleId(location.pathname);

  if (isCeo(principal)) return children;

  if (!role) {
    return <Navigate replace to="/dashboard" />;
  }

  const routeAllowed = canAccess(role, location.pathname);
  const moduleAllowed = moduleId ? canViewModule(principal, moduleId) : true;

  if (routeAllowed || moduleAllowed) {
    return children;
  }

  return <Navigate replace to="/dashboard" />;
}
