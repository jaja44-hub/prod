import assert from 'node:assert/strict';
import { getPrincipal, canViewModule, resolveEnabledModules } from '../src/lib/policy.js';
import { canAccessModuleByContext, getModuleForModel } from '../api/lib/tenantPolicy.js';

const principal = getPrincipal({ role: 'warehouse_head', tier: 2, tenantId: 'production' });
assert.equal(canViewModule(principal, 'inventory', ['inventory', 'sales']), true, 'warehouse head should access inventory when entitled');
assert.equal(canViewModule(principal, 'finance', ['inventory', 'sales']), false, 'warehouse head should not access finance without entitlement');
assert.deepEqual(resolveEnabledModules(principal, null, { modules: ['inventory', 'purchase'] }), ['inventory', 'purchase'], 'package modules should override fallback modules');

assert.equal(getModuleForModel('sale.order'), 'sales', 'sales order should map to sales module');
assert.equal(getModuleForModel('account.move'), 'finance', 'account move should map to finance module');

const policyContext = {
  role: 'warehouse_head',
  tier: 2,
  tenantId: 'production',
  enabledModules: ['inventory', 'sales'],
};
assert.equal(canAccessModuleByContext(policyContext, 'inventory'), true, 'tenant context should allow inventory');
assert.equal(canAccessModuleByContext(policyContext, 'finance'), false, 'tenant context should block finance');

console.log('phase6-hardening tests passed');
