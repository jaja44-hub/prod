/**
 * src/lib/policy.js
 * Unified client-side policy helper for Addis Crown ERP.
 * See: dev notes/trophy/architecture/TARGET-SAAS-MVP-4-MODULES.md
 *
 * planTier: 1 = enterprise, 2 = pro, 3 = starter
 */

export function getPrincipal(userProfile) {
  if (!userProfile) return null;
  return {
    role: userProfile.role || 'viewer',
    planTier: Number(userProfile.tier ?? userProfile.planTier ?? 3),
    tenantId: userProfile.tenantId || 'production',
  };
}

export function isCeo(principal) {
  return principal?.role === 'ceo';
}

const MODULE_ACCESS = {
  dashboard: () => true,
  inventory: (principal) => ['ceo', 'warehouse_head'].includes(principal.role),
  sales: (principal) => ['ceo', 'sales_head'].includes(principal.role),
  purchase: (principal) => ['ceo', 'warehouse_head'].includes(principal.role),
  finance: (principal) => principal.role === 'ceo',
  hr: (principal) => ['ceo', 'hr_head'].includes(principal.role),
};

export function canViewModule(principal, moduleId) {
  if (!principal) return false;
  if (isCeo(principal)) return true;
  const fn = MODULE_ACCESS[moduleId];
  return fn ? fn(principal) : false;
}

export function canViewAnalytics(principal) {
  if (!principal) return false;
  if (isCeo(principal)) return true;
  return principal.planTier <= 2;
}
