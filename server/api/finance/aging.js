import { verifyBearerToken } from '../lib/firebaseAdmin.js';
import { enforceModuleAccess } from '../lib/policyOrchestrator.js';
import { getTenantDataset } from '../lib/moduleDataStore.js';
import { buildFinanceAgingSeed } from '../lib/productionSeedCatalog.js';

function bucketAging(lines = []) {
  const now = Date.now();
  const buckets = {
    current: [],
    days30: [],
    days60: [],
    days90: [],
    over90: [],
  };

  for (const line of lines) {
    const due = new Date(line.dueDate).getTime();
    const age = Math.max(0, Math.floor((now - due) / (1000 * 60 * 60 * 24)));
    const entry = { ...line, ageDays: age };
    if (age <= 0) buckets.current.push(entry);
    else if (age <= 30) buckets.days30.push(entry);
    else if (age <= 60) buckets.days60.push(entry);
    else if (age <= 90) buckets.days90.push(entry);
    else buckets.over90.push(entry);
  }
  return buckets;
}

export function computeAgingReport({ vendorLines = [], customerLines = [] } = {}) {
  return {
    generatedAt: new Date().toISOString(),
    accountsPayable: bucketAging(vendorLines),
    accountsReceivable: bucketAging(customerLines),
    summary: {
      totalPayable: vendorLines.reduce((sum, ln) => sum + Number(ln.amount || 0), 0),
      totalReceivable: customerLines.reduce((sum, ln) => sum + Number(ln.amount || 0), 0),
      vendorCount: vendorLines.length,
      customerCount: customerLines.length,
    },
  };
}

async function fetchOdooFinanceData(tenantId) {
  try {
    const odooProxyUrl = process.env.ODOO_PROXY_URL || '/api/odooProxy';
    
    // Fetch vendor bills (Accounts Payable)
    const vendorResponse = await fetch(odooProxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': process.env.ODOO_PROXY_SKIP_AUTH === 'true' ? '' : `Bearer ${process.env.INTERNAL_API_TOKEN || ''}`,
      },
      body: JSON.stringify({
        model: 'account.move',
        method: 'search_read',
        args: [[['move_type', '=', 'in_invoice'], ['state', 'in', ['posted', 'in_payment']]]],
        kwargs: {
          fields: ['id', 'name', 'partner_id', 'invoice_date', 'invoice_date_due', 'amount_total', 'amount_residual', 'currency_id'],
          limit: 50,
        },
        tenantId,
      }),
    });
    
    // Fetch customer invoices (Accounts Receivable)
    const customerResponse = await fetch(odooProxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': process.env.ODOO_PROXY_SKIP_AUTH === 'true' ? '' : `Bearer ${process.env.INTERNAL_API_TOKEN || ''}`,
      },
      body: JSON.stringify({
        model: 'account.move',
        method: 'search_read',
        args: [[['move_type', '=', 'out_invoice'], ['state', 'in', ['posted', 'in_payment']]]],
        kwargs: {
          fields: ['id', 'name', 'partner_id', 'invoice_date', 'invoice_date_due', 'amount_total', 'amount_residual', 'currency_id'],
          limit: 50,
        },
        tenantId,
      }),
    });
    
    const vendorResult = await vendorResponse.json();
    const customerResult = await customerResponse.json();
    
    if (vendorResult.success && customerResult.success) {
      return transformOdooMoves(vendorResult.data, customerResult.data);
    }
    
    return null;
  } catch (err) {
    console.warn('[finance/aging] Failed to fetch from Odoo proxy:', err?.message || err);
    return null;
  }
}

function transformOdooMoves(vendorMoves, customerMoves) {
  const vendorLines = vendorMoves.map(move => ({
    invoiceId: move.name || `ap-${move.id}`,
    vendorName: move.partner_id?.[1] || 'Unknown Vendor',
    dueDate: move.invoice_date_due || move.invoice_date || new Date().toISOString(),
    amount: move.amount_residual || move.amount_total || 0,
    currency: move.currency_id?.[1] || 'ETB',
  }));
  
  const customerLines = customerMoves.map(move => ({
    invoiceId: move.name || `ar-${move.id}`,
    customerName: move.partner_id?.[1] || 'Unknown Customer',
    dueDate: move.invoice_date_due || move.invoice_date || new Date().toISOString(),
    amount: move.amount_residual || move.amount_total || 0,
    currency: move.currency_id?.[1] || 'ETB',
  }));
  
  return { vendorLines, customerLines };
}

export async function buildSeededFinanceAgingData(tenantId = 'production') {
  // Try Odoo proxy first for real data
  const odooData = await fetchOdooFinanceData(tenantId);
  if (odooData && (odooData.vendorLines.length > 0 || odooData.customerLines.length > 0)) {
    return {
      tenantId,
      vendorLines: odooData.vendorLines,
      customerLines: odooData.customerLines,
      report: computeAgingReport(odooData),
    };
  }
  
  // Fallback to Firestore seed data
  const dataset = await getTenantDataset(tenantId, 'finance_aging', buildFinanceAgingSeed);
  const vendorLines = dataset.vendorLines || [];
  const customerLines = dataset.customerLines || [];
  return {
    tenantId,
    vendorLines,
    customerLines,
    report: computeAgingReport({ vendorLines, customerLines }),
  };
}

export function computeAgingMultiCurrency({ vendorLines = [], customerLines = [], fxRates = {} } = {}) {
  function convert(line) {
    const rate = fxRates[line.currency] || 1;
    return { ...line, amountBase: Number(line.amount || 0) * rate };
  }
  const v = vendorLines.map(convert);
  const c = customerLines.map(convert);
  const baseReport = computeAgingReport({ vendorLines: v, customerLines: c });
  return { fxRates, baseCurrency: 'BASE', ...baseReport };
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
    await enforceModuleAccess(decoded || {}, 'finance', 'aging');
    const tenantId = decoded?.tenantId || decoded?.tenant_id || 'production';

    const seeded = await buildSeededFinanceAgingData(tenantId);
    return res.status(200).json({ success: true, tenantId, report: seeded.report, data: seeded });
  } catch (err) {
    console.error('[finance/aging] error', err?.message || err);
    return res.status(500).json({ success: false, error: err?.message || 'Internal' });
  }
}
