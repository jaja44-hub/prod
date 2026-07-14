import { verifyBearerToken } from '../lib/firebaseAdmin.js';
import { enforceModuleAccess } from '../lib/policyOrchestrator.js';
import { getSalesAnalytics } from '../lib/neonAgingQueries.js';

function createId(prefix = 'so') {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}-${Date.now()}`;
}

export async function seedSalesOrders(tenantId = 'production') {
  // Sales orders from Neon DB with graceful fallback when NEON_DATABASE_URL is not configured
  try {
    const neonSales = await getSalesAnalytics(tenantId);
    return neonSales.map(sale => ({
      id: sale.order_id,
      name: sale.order_name,
      orderId: sale.order_id,
      partnerId: sale.partner_id,
      partnerName: sale.partner_name,
      amount_total: Number(sale.amount_total),
      amountTotal: Number(sale.amount_total),
      state: sale.state,
      dateOrder: sale.date_order,
      tenantId,
    }));
  } catch (err) {
    // Neon DB not configured or unavailable — return empty so dashboard renders
    console.warn('[sales/orders] Neon DB unavailable, returning empty orders:', err?.message || err);
    return [];
  }
}

export async function createOrder(tenantId = 'production', payload = {}) {
  try {
    let ServiceGateway = null;
    try { ServiceGateway = await import('../../../src/services/ServiceGateway.js'); } catch { ServiceGateway = null; }
    const created = ServiceGateway?.createOdooSalesOrder ? await ServiceGateway.createOdooSalesOrder({ partner_id: payload.partnerId, origin: payload.origin || '', lines: payload.lines || [] }, { actorUid: payload.actorUid }) : null;
    if (created) return { source: 'odoo', order: created };
    throw new Error('Odoo create not available');
  } catch {
    const id = createId('ord');
    const record = {
      id,
      name: payload.name || `Order ${id}`,
      partnerId: payload.partnerId || null,
      lines: payload.lines || [],
      amount_total: payload.lines ? payload.lines.reduce((s, l) => s + Number(l.quantity || 0) * Number(l.unitPrice || 0), 0) : 0,
      amountTotal: payload.lines ? payload.lines.reduce((s, l) => s + Number(l.quantity || 0) * Number(l.unitPrice || 0), 0) : 0,
      state: 'draft',
      tenantId,
      createdAt: new Date().toISOString(),
    };
    const dataset = await getTenantDataset(tenantId, 'sales_orders', buildSalesOrdersSeed);
    const records = [...(dataset.records || []), record];
    await saveTenantDataset(tenantId, 'sales_orders', { ...dataset, records });
    try {
      const SG = (await import('../../../src/services/ServiceGateway.js')).default;
      if (SG?.logAuditEvent) await SG.logAuditEvent({ entityType: 'sales', action: 'order.create', entityId: id, tenantId, success: true });
    } catch { /* ignore */ }
    return { source: 'firestore', order: record };
  }
}

export async function getOrders(tenantId = 'production') {
  return seedSalesOrders(tenantId);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  try {
    const decoded = await verifyBearerToken(req);
    if (!decoded) return res.status(401).json({ error: 'Unauthorized' });
    await enforceModuleAccess(decoded || {}, 'sales', 'orders');
    const tenantId = decoded?.tenantId || decoded?.tenant_id || 'production';

    if (req.method === 'GET') {
      const data = await getOrders(tenantId);
      return res.status(200).json({ success: true, data, meta: { tenantId } });
    }

    if (req.method === 'POST') {
      const payload = req.body || {};
      const result = await createOrder(tenantId, payload);
      return res.status(201).json({ success: true, data: result.order, meta: { tenantId, source: result.source } });
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (err) {
    console.error('[sales/orders] error', err?.message || err);
    return res.status(500).json({ success: false, error: err?.message || 'Internal' });
  }
}
