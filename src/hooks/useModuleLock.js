/**
 * useModuleLock — Prod sector stub
 * In production, module access is enforced by RoleGuard at the route level.
 * This hook is a no-op that always reports modules as unlocked.
 */
export function useModuleLock(_moduleName) {
  return { locked: false, loading: false };
}
