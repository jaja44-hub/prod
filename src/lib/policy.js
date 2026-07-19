/**
 * src/lib/policy.js
 * Unified client-side policy helper for Addis Crown ERP.
 * See: dev notes/trophy/architecture/TARGET-SAAS-MVP-4-MODULES.md
 *
 * planTier: 1 = enterprise, 2 = pro, 3 = starter
 */

// Client-side policy context builder
function buildPolicyContext(principal, enabledTenantModules = null) {
  return {
    role: principal.role,
    tier: principal.tier,
    tenantId: principal.tenantId,
    enabledModules: enabledTenantModules || modulesForPlanTier(principal.tier),
  };
}

// Client-side module access checker
function canAccessModuleByContext(context, moduleId) {
  if (!context) return false;
  
  const modules = context.enabledModules || modulesForPlanTier(context.tier);
  return modules.includes(moduleId);
}

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

// planTier: 1 = enterprise, 2 = pro, 3 = starter
const TIER_MODULES = {
  1: ['dashboard', 'inventory', 'sales', 'purchase', 'finance'],
  2: ['dashboard', 'inventory', 'sales', 'purchase'],
  3: ['dashboard', 'inventory', 'sales'],
};

export function modulesForPlanTier(planTier) {
  return TIER_MODULES[planTier] || TIER_MODULES[3];
}

export function canViewModule(principal, moduleId, enabledTenantModules = null) {
  if (!principal) return false;
  if (moduleId === 'dashboard') return true;

  const context = buildPolicyContext({
    role: principal.role,
    tier: principal.planTier,
    tenantId: principal.tenantId,
  }, enabledTenantModules);

  if (Array.isArray(enabledTenantModules)) {
    if (!enabledTenantModules.includes(moduleId)) {
      return false;
    }
  } else {
    if (!modulesForPlanTier(principal.planTier).includes(moduleId)) {
      return false;
    }
  }

  if (isCeo(principal)) return true;
  const fn = MODULE_ACCESS[moduleId];
  return fn ? fn(principal) : canAccessModuleByContext(context, moduleId);
}

export function resolveEnabledModules(principal, tenantModulesFromFirestore, policyContext = null) {
  if (Array.isArray(tenantModulesFromFirestore)) {
    return tenantModulesFromFirestore;
  }

  const packageModules = Array.isArray(policyContext?.modules)
    ? policyContext.modules
    : Array.isArray(policyContext?.enabledModules)
      ? policyContext.enabledModules
      : null;

  if (Array.isArray(packageModules) && packageModules.length > 0) {
    return packageModules;
  }

  return modulesForPlanTier(principal.planTier);
}

export function canViewAnalytics(principal) {
  if (!principal) return false;
  if (isCeo(principal)) return true;
  return principal.planTier <= 2;
}

export function isPlatformAdmin(userProfile) {
  if (!userProfile) return false;
  return userProfile.role === 'platform_admin' || (typeof userProfile.email === 'string' && userProfile.email.startsWith('platform_admin@'));
}
