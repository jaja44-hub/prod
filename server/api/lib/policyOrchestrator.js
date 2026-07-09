import { buildPolicyContext, canAccessModuleByContext } from './tenantPolicy.js';

async function tryAudit(event) {
  try {
    const mod = await import('../../src/services/LogicServiceGateway.js');
    if (mod?.logAuditEvent) await mod.logAuditEvent(event);
  } catch (e) {
    // no-op: auditing is best-effort and must not block policy enforcement
  }
}

/**
 * Lightweight policy orchestrator.
 * - Centralizes policy checks for actions across API proxies
 * - Emits audit hooks via `safeLogAuditEvent` when provided
 */
export function checkModuleAccess(userProfile = {}, moduleId) {
  const ctx = buildPolicyContext(userProfile, userProfile?.enabledModules || null);
  const ok = canAccessModuleByContext(ctx, moduleId);
  return { ok, context: ctx };
}

export async function enforceModuleAccess(userProfile = {}, moduleId, action = 'access') {
  const r = checkModuleAccess(userProfile, moduleId);
  if (!r.ok) {
    await tryAudit({ entityType: 'policy', action: 'access_denied', module: moduleId, actor: userProfile?.uid || 'unknown', tenantId: r.context.tenantId, detail: `Denied ${action} on ${moduleId}` });
    throw new Error(`Policy: access denied for module ${moduleId}`);
  }
  return r.context;
}

export default {
  checkModuleAccess,
  enforceModuleAccess,
};
