import xmlrpc from 'xmlrpc';
import { verifyBearerToken, logSkipAuthWarning } from './lib/firebaseAdmin.js';
import {
  getTenantDomainTermsAsync,
  mergeOdooDomains,
} from './lib/tenantOdooDomain.js';
import { authenticateOdooDb } from './lib/resolveOdooDb.js';

const ALLOWED_MODELS = new Set([
  'product.product',
  'product.category',
  'stock.location',
  'stock.quant',
  'stock.valuation.layer',
  'sale.order',
  'sale.order.line',
  'purchase.order',
  'purchase.order.line',
  'res.partner',
  'hr.employee',
  'account.account',
  'account.move',
  'account.payment',
  'account.journal',
  'mrp.production',
]);

// Helper to create an XML-RPC client pointed at the right Odoo path
const getClient = (path) => {
  const odooUrl = process.env.ODOO_URL || '';
  if (!odooUrl) throw new Error('ODOO_URL environment variable is missing.');

  const url = new URL(odooUrl);
  const options = {
    host: url.hostname,
    port: url.port || (url.protocol === 'https:' ? 443 : 80),
    path,
  };

  return url.protocol === 'https:'
    ? xmlrpc.createSecureClient(options)
    : xmlrpc.createClient(options);
};

const authenticate = (db, user, apiKey) => {
  const client = getClient('/xmlrpc/2/common');
  return authenticateOdooDb(client, db, user, apiKey);
};

const executeKw = (db, uid, apiKey, model, method, args, kwargs) => new Promise((resolve, reject) => {
  const client = getClient('/xmlrpc/2/object');
  client.methodCall('execute_kw', [db, uid, apiKey, model, method, args, kwargs], (error, value) => {
    if (error) reject(error);
    else resolve(value);
  });
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Content-Type, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  try {
    const { model, method, args = [], kwargs = {} } = req.body;

    if (!model || !method) {
      return res.status(400).json({ error: 'Missing required parameters: model, method' });
    }

    if (!ALLOWED_MODELS.has(model)) {
      return res.status(403).json({ error: `Model not allowed: ${model}` });
    }

    const authHeader = req.headers.authorization;
    const skipAuth = process.env.ODOO_PROXY_SKIP_AUTH === 'true';
    let decoded = null;

    if (skipAuth) {
      logSkipAuthWarning();
    } else {
      try {
        decoded = await verifyBearerToken(authHeader);
      } catch (verifyErr) {
        console.error('[Odoo Proxy] Token verification failed:', verifyErr.message);
        return res.status(401).json({
          error: verifyErr.message?.includes('FIREBASE_SERVICE_ACCOUNT')
            ? 'Proxy auth misconfigured — set FIREBASE_SERVICE_ACCOUNT on Vercel'
            : 'Unauthorized',
        });
      }
      if (!decoded) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
    }

    const tenantId = decoded?.tenantId || decoded?.tenant_id || 'production';
    const role = decoded?.role || 'viewer';
    const uid = decoded?.uid || null;

    // B8 phase 2: enforce tenant-level domain filters in Odoo queries.
    // For read/query methods, merge tenant domain terms from the server-side
    // tenant map (TENANT_ODOO_DOMAIN_MAP) into the client's domain args.
    let tenantDomainApplied = false;
    const READ_METHODS = new Set(['search_read', 'search', 'read', 'name_search']);

    if (READ_METHODS.has(method) && Array.isArray(args) && Array.isArray(args[0])) {
      try {
        const tenantTerms = await getTenantDomainTermsAsync(tenantId, model);
        if (Array.isArray(tenantTerms) && tenantTerms.length > 0) {
          args[0] = mergeOdooDomains(args[0], tenantTerms);
          tenantDomainApplied = true;
        }
      } catch (e) {
        console.warn('[odooProxy] tenant domain merge failed:', e?.message || e);
      }
    }
    if (kwargs?.tenantId && kwargs.tenantId !== tenantId) {
      return res.status(403).json({ error: 'Tenant mismatch' });
    }

    const db = process.env.ODOO_DB;
    const user = process.env.ODOO_USER;
    const apiKey = process.env.ODOO_APIKEY;

    if (!db || !user || !apiKey) {
      throw new Error('Missing Odoo credentials in environment variables (ODOO_DB, ODOO_USER, ODOO_APIKEY).');
    }

    const session = await authenticate(db, user, apiKey);

    if (!session) {
      return res.status(401).json({
        error: 'Odoo authentication failed. Check ODOO_DB, ODOO_USER, and ODOO_APIKEY.',
      });
    }

    const data = await executeKw(session.db, session.uid, apiKey, model, method, args, kwargs);

    return res.status(200).json({
      success: true,
      data,
      meta: {
        tenantId,
        role,
        uid,
        tenantDomainApplied: !!tenantDomainApplied,
      },
    });
  } catch (error) {
    console.error('[Odoo Proxy Error]', error);
    return res.status(500).json({ success: false, error: error.message || 'Internal Server Error' });
  }
}
