import { verifyBearerToken } from '../lib/firebaseAdmin.js';
import { enforceModuleAccess } from '../lib/policyOrchestrator.js';
import odooClient from '../lib/odooClient.js';
import { getTenantDoc } from '../lib/tenantFirestore.js';

export function computeReorderSuggestion({ currentStock = 0, reorderPoint = 10, moq = 10 } = {}) {
  // Simple suggestion logic: if currentStock < reorderPoint, suggest ordering up to twice the reorderPoint, rounded to MOQs
  if (currentStock >= reorderPoint) return { shouldReorder: false, suggestedQty: 0 };
  const target = reorderPoint * 2;
  let suggested = Math.max(0, target - currentStock);
  // round up to MOQ
  if (moq > 1) {
    suggested = Math.ceil(suggested / moq) * moq;
  }
  return { shouldReorder: suggested > 0, suggestedQty: suggested };
}

async function fetchCurrentStockFromOdoo(tenantId, productId) {
  try {
    const model = 'stock.quant';
    const method = 'search_read';
    const domain = [['product_id', '=', Number(productId)]];
    // resolve tenant tenant odoo config
    let db = process.env.ODOO_DB;
    let user = process.env.ODOO_USER;
    let apiKey = process.env.ODOO_APIKEY;
    let customUrl = null;
    try {
      const tenantDoc = await getTenantDoc(tenantId);
      if (tenantDoc?.odooConfig) {
        if (tenantDoc.odooConfig.db) db = tenantDoc.odooConfig.db;
        if (tenantDoc.odooConfig.user) user = tenantDoc.odooConfig.user;
        if (tenantDoc.odooConfig.apiKey) apiKey = tenantDoc.odooConfig.apiKey;
        if (tenantDoc.odooConfig.url) customUrl = tenantDoc.odooConfig.url;
      }
    } catch (e) {}
    if (!db || !user || !apiKey) throw new Error('Odoo credentials missing');
    const session = await odooClient.authenticate(db, user, apiKey, customUrl);
    if (!session) throw new Error('Odoo auth failed');
    const args = [domain, ['quantity']];
    const rows = await odooClient.executeKw(session.db, session.uid, apiKey, model, method, args, {}, customUrl);
    // sum quantities
    if (!Array.isArray(rows)) return null;
    return rows.reduce((acc, r) => acc + Number(r.quantity || 0), 0);
  } catch (err) {
    return null;
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Content-Type, Authorization'
  );

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });

  try {
    const authHeader = req.headers.authorization;
    const decoded = await verifyBearerToken(authHeader);
    let stock = Number(currentStock || 0);
    // try to fetch live stock if not provided
    if (!stock) {
      const live = await fetchCurrentStockFromOdoo(tenantId, productId);
      if (live !== null) stock = Number(live);
    }
    const result = computeReorderSuggestion({ currentStock: Number(stock || 0), reorderPoint: Number(reorderPoint || 10), moq: Number(moq || 10) });
    const tenantId = decoded?.tenantId || decoded?.tenant_id || 'production';
    const { productId, currentStock, reorderPoint, moq } = req.body || {};
    if (!productId) return res.status(400).json({ error: 'Missing productId' });
    const result = computeReorderSuggestion({ currentStock: Number(currentStock || 0), reorderPoint: Number(reorderPoint || 10), moq: Number(moq || 10) });
    return res.status(200).json({ success: true, productId, tenantId, result });
  } catch (err) {
    console.error('[inventory/reorder-suggestion] error', err?.message || err);
    return res.status(500).json({ success: false, error: err?.message || 'Internal' });
  }
}
