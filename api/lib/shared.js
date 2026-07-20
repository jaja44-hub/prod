import { Pool } from 'pg';

let pool;

export function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL || process.env.NEON_DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });
  }
  return pool;
}

export function applyCors(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Content-Type, Authorization, X-Correlation-ID, X-Tenant-ID, X-Tenant-Id'
  );
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }
  return false;
}

/** Seed data uses tenant_default; auth profile often sends production. */
export function resolveTenantId(req) {
  const raw =
    req.query?.tenant_id ||
    req.headers['x-tenant-id'] ||
    req.headers['X-Tenant-ID'] ||
    'tenant_default';
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value === 'production') return 'tenant_default';
  return value || 'tenant_default';
}

export function routeSegments(req) {
  const pathParam = req.query?.path;
  if (Array.isArray(pathParam)) return pathParam.filter(Boolean);
  if (typeof pathParam === 'string' && pathParam) {
    return pathParam.split('/').filter(Boolean);
  }
  return [];
}

export async function tableExists(tableName) {
  const result = await getPool().query(
    `SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = $1
    ) AS ok`,
    [tableName]
  );
  return Boolean(result.rows[0]?.ok);
}

export function jsonError(res, status, message) {
  return res.status(status).json({ success: false, error: message });
}
