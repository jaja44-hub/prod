import pg from 'pg';

const { Pool } = pg;

let pool = null;

function getNeonPool() {
  if (pool) return pool;
  
  const connectionString = process.env.NEON_DATABASE_URL;
  if (!connectionString) {
    console.warn('[neonClient] NEON_DATABASE_URL not configured');
    return null;
  }
  
  pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false,
    },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });
  
  pool.on('error', (err) => {
    console.error('[neonClient] Unexpected error on idle client', err);
  });
  
  return pool;
}

export async function queryNeon(text, params = []) {
  const pool = getNeonPool();
  if (!pool) {
    throw new Error('Neon DB not configured');
  }
  
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('[neonClient] Executed query', { text: text.substring(0, 50), duration, rows: res.rowCount });
    return res;
  } catch (err) {
    console.error('[neonClient] Query failed', err);
    throw err;
  }
}

export async function getNeonClient() {
  const pool = getNeonPool();
  if (!pool) return null;
  return pool.connect();
}

export async function closeNeonPool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

export default {
  queryNeon,
  getNeonClient,
  closeNeonPool,
};
