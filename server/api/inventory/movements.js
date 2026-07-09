import { verifyBearerToken } from '../lib/firebaseAdmin.js';
import { enforceModuleAccess } from '../lib/policyOrchestrator.js';

<<<<<<< Updated upstream
export async function getMovements(tenantId = 'production') {
  // Stubbed, tenant-scoped movement history
  const now = Date.now();
  return [
    { productId: 'prod-100', qty: -10, type: 'sale', timestamp: new Date(now - 1000 * 60 * 60 * 24).toISOString() },
    { productId: 'prod-100', qty: 50, type: 'purchase', timestamp: new Date(now - 1000 * 60 * 60 * 48).toISOString() },
    { productId: 'prod-200', qty: -2, type: 'transfer', timestamp: new Date(now - 1000 * 60 * 60 * 6).toISOString() },
  ].map((m, i) => ({ ...m, tenantId }));
=======
function parseDomainValue(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function normalizeMovement(row, tenantId) {
  return {
    movementId: row.id || `move-${Date.now()}`,
    productId: row.product_id && row.product_id[0] ? `odoo-${row.product_id[0]}` : String(row.product_id || ''),
    qty: Number(row.product_uom_qty || 0),
    type: row.picking_type_id && row.picking_type_id[1] ? String(row.picking_type_id[1]) : 'move',
    sourceLocation: row.location_id && row.location_id[1] ? String(row.location_id[1]) : null,
    destinationLocation: row.location_dest_id && row.location_dest_id[1] ? String(row.location_dest_id[1]) : null,
    timestamp: row.create_date || new Date().toISOString(),
    meta: { raw: row },
    tenantId,
  };
}

export async function getMovements(tenantId = 'production', opts = {}) {
  try {
    const model = 'stock.move';
    const method = 'search_read';
    const domain = parseDomainValue(opts.domain);

    const tenantTerms = await getTenantDomainTermsAsync(tenantId, model);
    const fullDomain = mergeOdooDomains(Array.isArray(domain) ? domain : [], tenantTerms);

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
    } catch {
      // ignore, fallback to env
    }

    if (!db || !user || !apiKey) throw new Error('Odoo credentials missing');
    const session = await odooClient.authenticate(db, user, apiKey, customUrl);
    if (!session) throw new Error('Odoo auth failed');

    const args = [fullDomain, ['id', 'product_id', 'product_uom_qty', 'location_id', 'location_dest_id', 'create_date', 'picking_type_id']];
    const rows = await odooClient.executeKw(session.db, session.uid, apiKey, model, method, args, {}, customUrl);
    return (Array.isArray(rows) ? rows : []).map((row) => normalizeMovement(row, tenantId));
  } catch (err) {
    const now = Date.now();
    return [
      {
        movementId: 'stub-1',
        productId: 'prod-100',
        qty: -10,
        type: 'sale',
        sourceLocation: 'Warehouse A',
        destinationLocation: 'Customer Site',
        timestamp: new Date(now - 1000 * 60 * 60 * 24).toISOString(),
        meta: { reason: 'stub fallback' },
        tenantId,
      },
      {
        movementId: 'stub-2',
        productId: 'prod-100',
        qty: 50,
        type: 'purchase',
        sourceLocation: 'Supplier Dock',
        destinationLocation: 'Warehouse A',
        timestamp: new Date(now - 1000 * 60 * 60 * 48).toISOString(),
        meta: { reason: 'stub fallback' },
        tenantId,
      },
      {
        movementId: 'stub-3',
        productId: 'prod-200',
        qty: -2,
        type: 'transfer',
        sourceLocation: 'Warehouse A',
        destinationLocation: 'Warehouse B',
        timestamp: new Date(now - 1000 * 60 * 60 * 6).toISOString(),
        meta: { reason: 'stub fallback' },
        tenantId,
      },
    ];
  }
>>>>>>> Stashed changes
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Content-Type, Authorization'
  );

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Use GET' });

  try {
    const decoded = await verifyBearerToken(req);
    if (!decoded) return res.status(401).json({ error: 'Unauthorized' });
    await enforceModuleAccess(decoded || {}, 'inventory', 'movements');
    const tenantId = decoded?.tenantId || decoded?.tenant_id || 'production';
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const rawDomain = url.searchParams.get('domain');
    const data = await getMovements(tenantId, { domain: rawDomain });
    return res.status(200).json({ success: true, data, meta: { tenantId } });
  } catch (err) {
    console.error('[inventory/movements] error', err?.message || err);
    return res.status(500).json({ success: false, error: err?.message || 'Internal' });
  }
}
