export const MODULE_REGISTRY = {
  dashboard: {
    id: 'dashboard',
    routes: ['/dashboard', '/analytics'],
    minPlanTier: 3,
    status: 'active',
    roleAccess: ['all'],
  },
  inventory: {
    id: 'inventory',
    routes: ['/inventory', '/work-orders', '/barcode', '/qc', '/logistics'],
    minPlanTier: 3,
    status: 'active',
    roleAccess: ['warehouse_head', 'ceo'],
  },
  sales: {
    id: 'sales',
    routes: ['/sales', '/crm', '/customers', '/orders'],
    minPlanTier: 3,
    status: 'active',
    roleAccess: ['sales_head', 'ceo'],
  },
  purchase: {
    id: 'purchase',
    routes: ['/purchases', '/suppliers'],
    minPlanTier: 2,
    status: 'active',
    roleAccess: ['warehouse_head', 'ceo'],
  },
  finance: {
    id: 'finance',
    routes: ['/finance', '/invoices', '/reports'],
    minPlanTier: 1,
    status: 'active',
    roleAccess: ['ceo'],
  },
  hr: {
    id: 'hr',
    routes: ['/hr', '/employees', '/payroll'],
    minPlanTier: 3,
    status: 'future',
    roleAccess: ['hr_head', 'ceo'],
  },
};

export function getModuleDef(moduleId) {
  return MODULE_REGISTRY[moduleId] || null;
}

export function listRegistryModuleIds() {
  return Object.keys(MODULE_REGISTRY);
}

export function getModuleIdForPath(pathname) {
  if (!pathname || typeof pathname !== 'string') return null;
  const normalized = pathname.toLowerCase();

  for (const moduleId of listRegistryModuleIds()) {
    const def = getModuleDef(moduleId);
    if (!def || !Array.isArray(def.routes)) continue;
    if (def.routes.some((routePrefix) => normalized === routePrefix || normalized.startsWith(`${routePrefix}/`))) {
      return moduleId;
    }
  }

  return null;
}

export function getModuleRoutes(moduleId) {
  const def = getModuleDef(moduleId);
  return def?.routes || [];
}

const ODOO_MODEL_MODULE_MAP = {
  'product.product': 'inventory',
  'sale.order': 'sales',
  'purchase.order': 'purchase',
  'account.account': 'finance',
};

export function getModuleIdForOdooModel(modelName) {
  return ODOO_MODEL_MODULE_MAP[modelName] || null;
}

export default {
  MODULE_REGISTRY,
  getModuleDef,
  listRegistryModuleIds,
  getModuleIdForPath,
  getModuleRoutes,
  getModuleIdForOdooModel,
};
