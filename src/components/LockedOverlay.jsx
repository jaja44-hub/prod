/**
 * LockedOverlay — Prod sector stub
 * In production, access is controlled by RoleGuard at the route level.
 * This component is a transparent passthrough that renders children directly.
 */
export default function LockedOverlay({ children }) {
  return children;
}
