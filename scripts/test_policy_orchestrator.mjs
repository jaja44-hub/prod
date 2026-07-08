import { checkModuleAccess, enforceModuleAccess } from '../api/lib/policyOrchestrator.js';

(async () => {
  try {
    // allowed user for inventory
    const userOk = { uid: 'u1', role: 'inventory_manager', tenantId: 't1', enabledModules: ['inventory'] };
    const r1 = checkModuleAccess(userOk, 'inventory');
    if (!r1.ok) throw new Error('Expected inventory access to be allowed');
    await enforceModuleAccess(userOk, 'inventory');

    // disallowed user for finance
    const userNo = { uid: 'u2', role: 'viewer', tenantId: 't1', enabledModules: [] };
    const r2 = checkModuleAccess(userNo, 'finance');
    if (r2.ok) throw new Error('Expected finance access to be denied');
    let threw = false;
    try {
      await enforceModuleAccess(userNo, 'finance');
    } catch (e) {
      threw = true;
    }
    if (!threw) throw new Error('enforceModuleAccess should have thrown for denied user');

    console.log('policy orchestrator tests passed');
    process.exit(0);
  } catch (err) {
    console.error('policy orchestrator tests failed', err);
    process.exit(2);
  }
})();
