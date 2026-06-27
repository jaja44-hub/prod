import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { canAccess } from '../lib/rbac';

/**
 * Wraps any route. If the logged-in user doesn't have access,
 * redirects to /dashboard. CEOs always pass through.
 */
export default function RoleGuard({ children }) {
  const { userProfile, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;

  const role = userProfile?.role;
  // CEO has unrestricted access
  if (role === 'ceo') return children;
  // For all others, check route access
  if (!role || !canAccess(role, location.pathname)) {
    return <Navigate replace to="/dashboard" />;
  }
  return children;
}
