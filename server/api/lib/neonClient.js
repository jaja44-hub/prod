import { getPool } from '../../../api/lib/shared.js';

/**
 * Re-exported legacy adapter over api/lib/shared.js getPool()
 * (S1.5 SSOT: server DB clients now share the single pool factory).
 * Default DB type maps to the primary Neon/DATABASE_URL connection —
 * the same behavior as the pre-S1.5 neonClient.
 */

export async function queryNeon(text, params = []) {
  const pool = getPool('default');
  try {
    const res = await pool.query(text, params);
    return res;
  } catch (err) {
    console.error('[neonClient] Query failed', err);
    throw err;
  }
}

export async function getNeonClient() {
  const pool = getPool('default');
  return pool.connect();
}

export async function closeNeonPool() {
  // Pools are owned by the shared SSOT and kept alive for serverless reuse.
}

export default {
  queryNeon,
  getNeonClient,
  closeNeonPool,
};
