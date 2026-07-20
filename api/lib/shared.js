import { Pool } from 'pg';

let pool;

export function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;
    if (!connectionString) {
      const err = new Error('DATABASE_URL is not configured');
      err.code = 'NO_DATABASE_URL';
      throw err;
    }
    pool = new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 2,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 8_000,
    });
  }
  return pool;
}

export function isDbUnavailable(error) {
  const msg = String(error?.message || error || '').toLowerCase();
  return (
    error?.code === 'NO_DATABASE_URL' ||
    msg.includes('quota') ||
    msg.includes('exceeded') ||
    msg.includes('connect') ||
    msg.includes('timeout') ||
    msg.includes('econnrefused') ||
    msg.includes('terminat')
  );
}

/** Seed-aligned fallback when Neon is sleeping or over quota. */
export const FALLBACK_DASHBOARD_METRICS = {
  revenue: 2840000,
  orders: 15,
  pipelineValue: 1860000,
  warehouseReadyToPick: 2,
  receivables: 145000,
  payables: 92000,
  salesScore: 82,
  crmScore: 78,
  purchaseScore: 74,
  warehouseScore: 87,
  financeScore: 84,
};

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

export function routeSegments(req, mount = '') {
  const pathParam = req.query?.path ?? req.query?.segments;
  if (Array.isArray(pathParam) && pathParam.length) return pathParam.filter(Boolean);
  if (typeof pathParam === 'string' && pathParam.trim()) {
    return pathParam.split('/').filter(Boolean);
  }

  const url = (req.url || '').split('?')[0];
  if (mount) {
    const prefix = `/api/${mount}/`;
    if (url.startsWith(prefix)) {
      const tail = url.slice(prefix.length);
      if (tail) return tail.split('/').filter(Boolean);
    }
  }
  return [];
}

export async function tableExists(tableName) {
  try {
    const result = await getPool().query(
      `SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = $1
      ) AS ok`,
      [tableName]
    );
    return Boolean(result.rows[0]?.ok);
  } catch {
    return false;
  }
}

export function jsonError(res, status, message) {
  return res.status(status).json({ success: false, error: message });
}

export async function runQuery(fn) {
  try {
    return await fn();
  } catch (error) {
    if (isDbUnavailable(error)) {
      return { degraded: true, error };
    }
    throw error;
  }
}
