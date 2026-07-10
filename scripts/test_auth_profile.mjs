import assert from 'node:assert/strict';
import { buildProfileFromToken } from '../src/lib/authProfile.js';

async function main() {
  let refreshCalls = 0;
  const user = {
    uid: 'u-123',
    email: 'demo@example.com',
    displayName: 'Demo User',
    getIdTokenResult: async (forceRefresh) => {
      refreshCalls += 1;
      assert.equal(forceRefresh, true, 'buildProfileFromToken should request a fresh token');
      return { claims: { role: 'ceo', tenantId: 'production', tier: 1 } };
    },
  };

  const profile = await buildProfileFromToken(user, { forceRefresh: true });
  assert.equal(profile.role, 'ceo');
  assert.equal(profile.tenantId, 'production');
  assert.equal(profile.tier, 1);
  assert.equal(refreshCalls, 1);
  console.log('✅ Auth profile regression check passed');
}

main().catch((error) => {
  console.error('❌ Auth profile regression check failed', error);
  process.exit(1);
});
