/**
 * src/lib/rbac.js
 * Role-Based Access Control definitions for Addis Crown ERP.
 * Roles: ceo > hr_head > sales_head > warehouse_head
 */

export const ROLES = {
  CEO: 'ceo',
  HR_HEAD: 'hr_head',
  SALES_HEAD: 'sales_head',
  WAREHOUSE_HEAD: 'warehouse_head',
};

// Role hierarchy for display
export const ROLE_LABELS = {
  ceo: 'CEO / Super Admin',
  hr_head: 'HR Director',
  sales_head: 'Sales Department Head',
  warehouse_head: 'Warehouse Store Head',
};

// Which nav sections each role can see
export const ROLE_NAV_ACCESS = {
  ceo: ['Operations', 'Procurement', 'Finance', 'People', 'Sales & CRM'],
  hr_head: ['People'],
  sales_head: ['Sales & CRM', 'Operations'],
  warehouse_head: ['Operations', 'Procurement'],
};

// Which routes each role can access
export const ROLE_ROUTE_ACCESS = {
  ceo: ['/dashboard', '/inventory', '/inventory/new', '/work-orders', '/sales', '/purchases', '/crm', '/hr', '/finance'],
  hr_head: ['/hr', '/dashboard'],
  sales_head: ['/sales', '/crm', '/dashboard'],
  warehouse_head: ['/inventory', '/inventory/new', '/purchases', '/dashboard'],
};

export function canAccess(role, route) {
  const allowed = ROLE_ROUTE_ACCESS[role] || [];
  return allowed.some(r => route.startsWith(r));
}

export function getNavSections(role) {
  return ROLE_NAV_ACCESS[role] || [];
}
