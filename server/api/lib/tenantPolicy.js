const MODULE_BY_MODEL = {
  'product.product': 'inventory',
  'product.category': 'inventory',
  'stock.location': 'inventory',
  'stock.quant': 'inventory',
  'sale.order': 'sales',
  'sale.order.line': 'sales',
  'purchase.order': 'purchase',
  'purchase.order.line': 'purchase',
  'res.partner': 'crm',
  'account.account': 'finance',
  'account.move': 'finance',
  'account.payment': 'finance',
  'account.journal': 'finance',
  'hr.employee': 'hr',
  'mrp.production': 'inventory',
};

const MODULE_ROLES = {
  inventory: ['ceo', 'warehouse_head', 'inventory_manager'],
  sales: ['ceo', 'sales_head', 'sales_manager'],
  purchase: ['ceo', 'warehouse_head', 'purchase_manager'],
  finance: ['ceo', 'finance_head', 'accountant'],
  crm: ['ceo', 'sales_head', 'sales_manager'],
  hr: ['ceo', 'hr_head'],
};

export function getModuleForModel(model) {
  return MODULE_BY_MODEL[model] || null;
}

export function canAccessModuleByContext(context = {}, moduleId) {
  if (!moduleId) return false;
  const role = context?.role || 'viewer';
  const enabledModules = Array.isArray(context?.enabledModules) ? context.enabledModules : [];
  if (enabledModules.length > 0 && !enabledModules.includes(moduleId)) {
    return false;
  }
  return (MODULE_ROLES[moduleId] || []).includes(role);
}

export function buildPolicyContext(userProfile = {}, enabledModules = null) {
  return {
    role: userProfile?.role || 'viewer',
    tier: Number(userProfile?.tier ?? userProfile?.planTier ?? 3),
    tenantId: userProfile?.tenantId || 'production',
    enabledModules: Array.isArray(enabledModules) ? enabledModules : null,
  };
}
