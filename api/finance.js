import { verifyBearerToken } from '../server/api/lib/firebaseAdmin.js';
import { enforceModuleAccess } from '../server/api/lib/policyOrchestrator.js';
import { computeAgingReport } from '../server/api/finance/aging.js';
import { matchPaymentsToInvoices } from '../server/api/finance/reconciliation.js';

function respond(res, status, payload) {
  res.setHeader('Content-Type', 'application/json');
  return res.status(status).json(payload);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Content-Type, Authorization'
  );

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const authHeader = req.headers.authorization;
    const decoded = await verifyBearerToken(authHeader);
    if (!decoded) return respond(res, 401, { error: 'Unauthorized' });
    await enforceModuleAccess(decoded || {}, 'finance', 'access');
    const tenantId = decoded?.tenantId || decoded?.tenant_id || 'production';
    const action = String(req.query?.action || req.body?.action || 'aging').toLowerCase();

    if (req.method === 'GET' && action === 'aging') {
      const vendorLines = [
        { invoiceId: 'inv-AP-001', vendorName: 'Zenith Supplies', dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), amount: 6200.5, currency: 'ETB' },
        { invoiceId: 'inv-AP-002', vendorName: 'Rhino Logistics', dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 35).toISOString(), amount: 18200.0, currency: 'ETB' },
      ];
      const customerLines = [
        { invoiceId: 'inv-AR-001', customerName: 'Addis Wholesale', dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10).toISOString(), amount: 14000.75, currency: 'ETB' },
        { invoiceId: 'inv-AR-002', customerName: 'Ethio Retail', dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(), amount: 7600.0, currency: 'ETB' },
      ];
      const report = computeAgingReport({ vendorLines, customerLines });
      return respond(res, 200, { success: true, tenantId, report });
    }

    if (req.method === 'POST' && action === 'reconciliation') {
      const { invoices, payments } = req.body || {};
      if (!Array.isArray(invoices) || !Array.isArray(payments)) {
        return respond(res, 400, { error: 'Missing invoices or payments arrays' });
      }
      const report = matchPaymentsToInvoices({ invoices, payments });
      return respond(res, 200, { success: true, tenantId, report });
    }

    return respond(res, 400, { error: 'Invalid finance action or method' });
  } catch (err) {
    console.error('[api/finance] error', err?.message || err);
    return respond(res, 500, { success: false, error: err?.message || 'Internal' });
  }
}
