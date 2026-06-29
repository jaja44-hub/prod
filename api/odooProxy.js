import xmlrpc from 'xmlrpc';
import { verifyBearerToken, logSkipAuthWarning } from './lib/firebaseAdmin.js';

const ALLOWED_MODELS = new Set([
  'product.product',
  'sale.order',
  'purchase.order',
  'res.partner',
  'hr.employee',
  'account.account',
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

const authenticate = (db, user, apiKey) => new Promise((resolve, reject) => {
  const client = getClient('/xmlrpc/2/common');
  client.methodCall('authenticate', [db, user, apiKey, {}], (error, value) => {
    if (error) reject(error);
    else resolve(value);
  });
});

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
      decoded = await verifyBearerToken(authHeader);
      if (!decoded) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
    }

    const tenantId = decoded?.tenantId || decoded?.tenant_id || 'production';
    const role = decoded?.role || 'viewer';
    const uid = decoded?.uid || null;

    // TODO B8 phase 2: enforce tenant-level domain filters in Odoo queries once
    // the server-side policy / tenant schema is available.
    if (kwargs?.tenantId && kwargs.tenantId !== tenantId) {
      return res.status(403).json({ error: 'Tenant mismatch' });
    }

    const db = process.env.ODOO_DB;
    const user = process.env.ODOO_USER;
    const apiKey = process.env.ODOO_APIKEY;

    if (!db || !user || !apiKey) {
      throw new Error('Missing Odoo credentials in environment variables (ODOO_DB, ODOO_USER, ODOO_APIKEY).');
    }

    const sessionUid = await authenticate(db, user, apiKey);

    if (!sessionUid) {
      return res.status(401).json({ error: 'Odoo authentication failed. Check ODOO_USER and ODOO_APIKEY.' });
    }

    const data = await executeKw(db, sessionUid, apiKey, model, method, args, kwargs);

    return res.status(200).json({
      success: true,
      data,
      meta: {
        tenantId,
        role,
        uid,
      },
    });
  } catch (error) {
    console.error('[Odoo Proxy Error]', error);
    return res.status(500).json({ success: false, error: error.message || 'Internal Server Error' });
  }
}
