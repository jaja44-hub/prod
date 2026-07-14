/**
 * server/api/lib/odooClient.js
 * Server-side Odoo XML-RPC client shared by inventory/movements and other server handlers.
 * Mirrors the XML-RPC logic in api/odooProxy.js but as a reusable module.
 */

import xmlrpc from 'xmlrpc';
import { authenticateOdooDb } from './resolveOdooDb.js';

function getClient(path, customUrl = null) {
  const odooUrl = customUrl || process.env.ODOO_URL || '';
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
}

/**
 * Authenticate against Odoo XML-RPC and return { uid, db } session.
 * Returns null if authentication fails.
 */
async function authenticate(db, user, apiKey, customUrl = null) {
  const client = getClient('/xmlrpc/2/common', customUrl);
  return authenticateOdooDb(client, db, user, apiKey);
}

/**
 * Execute an Odoo XML-RPC method (execute_kw).
 */
function executeKw(db, uid, apiKey, model, method, args, kwargs = {}, customUrl = null) {
  return new Promise((resolve, reject) => {
    const client = getClient('/xmlrpc/2/object', customUrl);
    client.methodCall(
      'execute_kw',
      [db, uid, apiKey, model, method, args, kwargs],
      (error, value) => {
        if (error) reject(error);
        else resolve(value);
      }
    );
  });
}

export default { authenticate, executeKw };
