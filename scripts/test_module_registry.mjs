import assert from 'assert';
import { getModuleIdForPath } from '../src/lib/moduleRegistry.js';
import { canViewModule, resolveEnabledModules } from '../src/lib/policy.js';

console.log('Running module registry tests...');

assert.strictEqual(getModuleIdForPath('/inventory'), 'inventory', 'getModuleIdForPath(/inventory) should resolve inventory');
assert.strictEqual(getModuleIdForPath('/work-orders/123'), 'inventory', 'getModuleIdForPath(/work-orders/123) should resolve inventory');
assert.strictEqual(getModuleIdForPath('/finance/reports'), 'finance', 'getModuleIdForPath(/finance/reports) should resolve finance');
assert.strictEqual(getModuleIdForPath('/dashboard'), 'dashboard', 'getModuleIdForPath(/dashboard) should resolve dashboard');
console.log('✅ PASS: path-to-module registry mapping');

const salesPrincipal = { role: 'sales_head', planTier: 3, tenantId: 'production' };
assert.strictEqual(canViewModule(salesPrincipal, 'sales', ['sales']), true, 'sales_head can view sales when enabled');
assert.strictEqual(canViewModule(salesPrincipal, 'finance', ['sales']), false, 'sales_head cannot view finance even when enabled modules include only sales');
console.log('✅ PASS: canViewModule honors tenant enabled modules');

const fallbackModules = resolveEnabledModules(salesPrincipal, null);
assert.deepStrictEqual(fallbackModules, ['dashboard', 'inventory', 'sales'], 'fallback enabled modules should match plan tier');
console.log('✅ PASS: resolveEnabledModules falls back to planTier modules');

console.log('\nAll module registry tests passed.');
process.exit(0);
