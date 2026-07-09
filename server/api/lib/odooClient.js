import xmlrpc from 'xmlrpc';
import { authenticateOdooDb } from './resolveOdooDb.js';

const getClient = (path, customUrl = null) => {
  const odooUrl = customUrl || process.env.ODOO_URL || '';
  if (!odooUrl) throw new Error('ODOO_URL environment variable is missing.');

  const url = new URL(odooUrl);
  const options = {
    host: url.hostname,
    port: url.port || (url.protocol === 'https:' ? 443 : 80),
    path,
  };

  return url.protocol === 'https:' ? xmlrpc.createSecureClient(options) : xmlrpc.createClient(options);
};

export const authenticate = (db, user, apiKey, customUrl = null) => {
  const client = getClient('/xmlrpc/2/common', customUrl);
  return authenticateOdooDb(client, db, user, apiKey);
};

export const executeKw = (db, uid, apiKey, model, method, args = [], kwargs = {}, customUrl = null) =>
  new Promise((resolve, reject) => {
    const client = getClient('/xmlrpc/2/object', customUrl);
    client.methodCall('execute_kw', [db, uid, apiKey, model, method, args, kwargs], (error, value) => {
      if (error) reject(error);
      else resolve(value);
    });
  });

export default { getClient, authenticate, executeKw };
