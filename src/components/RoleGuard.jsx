import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { canAccess } from '../lib/rbac';
import { getPrincipal, isCeo, canViewModule } from '../lib/policy';
import { getModuleIdForPath } from '../lib/moduleRegistry';

/**
 * Route guard: CEO passes; others need route RBAC and module policy (incl. planTier).
 */
export default function RoleGuard({ children }) {
  const { userProfile, currentUser, enabledModules, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;

  if (!currentUser) {
    return <Navigate replace to="/login" />;
  }

  const principal = getPrincipal(userProfile);
  const role = principal?.role;
  const moduleId = getModuleIdForPath(location.pathname);

  if (isCeo(principal)) return children;

  if (!role) {
    return <Navigate replace to="/dashboard" />;
  }

  const routeAllowed = canAccess(role, location.pathname);
  const moduleAllowed = moduleId ? canViewModule(principal, moduleId, enabledModules) : true;

  if (moduleId && !moduleAllowed) {
    return <Navigate replace to="/dashboard" />;
  }

  if (!routeAllowed) {
    return <Navigate replace to="/dashboard" />;
  }

  return children;
}
