import xmlrpc from 'xmlrpc';

// Helper to create an XML-RPC client pointed at the right Odoo path
const getClient = (path) => {
  const odooUrl = process.env.ODOO_URL || '';
  if (!odooUrl) throw new Error("ODOO_URL environment variable is missing.");

  const url = new URL(odooUrl);
  const options = {
    host: url.hostname,
    port: url.port || (url.protocol === 'https:' ? 443 : 80),
    path: path
  };

  return url.protocol === 'https:'
    ? xmlrpc.createSecureClient(options)
    : xmlrpc.createClient(options);
};

// Promisify XML-RPC calls
const authenticate = (db, user, apiKey) => new Promise((resolve, reject) => {
  const client = getClient('/xmlrpc/2/common');
  // Odoo accepts the API key directly in place of the password
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
  // CORS headers — allow calls from Vercel frontend
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

    const db     = process.env.ODOO_DB;
    const user   = process.env.ODOO_USER;
    const apiKey = process.env.ODOO_APIKEY; // Secure API key — never exposed to browser

    if (!db || !user || !apiKey) {
      throw new Error("Missing Odoo credentials in environment variables (ODOO_DB, ODOO_USER, ODOO_APIKEY).");
    }

    // 1. Authenticate with Odoo using the API Key to get a secure session UID
    const uid = await authenticate(db, user, apiKey);

    if (!uid) {
      return res.status(401).json({ error: 'Odoo authentication failed. Check ODOO_USER and ODOO_APIKEY.' });
    }

    // 2. Execute the requested Odoo model method securely on the server
    const data = await executeKw(db, uid, apiKey, model, method, args, kwargs);

    return res.status(200).json({ success: true, data });

  } catch (error) {
    console.error('[Odoo Proxy Error]', error);
    return res.status(500).json({ success: false, error: error.message || 'Internal Server Error' });
  }
}
