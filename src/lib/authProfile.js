export async function buildProfileFromToken(user, options = {}) {
  const { forceRefresh = true } = options;
  if (!user?.getIdTokenResult) {
    return {
      uid: user?.uid || null,
      email: user?.email || null,
      name: user?.displayName || user?.email || null,
      role: 'viewer',
      tenantId: 'production',
      tier: 1,
    };
  }

  const tokenResult = await user.getIdTokenResult(forceRefresh);
  return {
    uid: user.uid,
    email: user.email,
    name: user.displayName || user.email,
    role: tokenResult?.claims?.role || 'viewer',
    tenantId: tokenResult?.claims?.tenantId || 'production',
    tier: tokenResult?.claims?.tier ?? 1,
  };
}
