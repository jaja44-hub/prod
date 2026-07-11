import { verifyBearerToken } from '../lib/firebaseAdmin.js';
import { enforceModuleAccess } from '../lib/policyOrchestrator.js';

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

export function buildSeededFinanceAgingData(tenantId = 'production') {
  const now = Date.now();
  const vendorLines = [
    { invoiceId: 'ap-001', vendorName: 'Zenith Supplies', dueDate: new Date(now - 1000 * 60 * 60 * 24 * 5).toISOString(), amount: 6200.5, currency: 'ETB' },
    { invoiceId: 'ap-002', vendorName: 'Rhino Logistics', dueDate: new Date(now - 1000 * 60 * 60 * 24 * 35).toISOString(), amount: 18200.0, currency: 'ETB' },
    { invoiceId: 'ap-003', vendorName: 'Alem Pharma', dueDate: new Date(now - 1000 * 60 * 60 * 24 * 110).toISOString(), amount: 4700.25, currency: 'ETB' },
    { invoiceId: 'ap-004', vendorName: 'Mulu Motors', dueDate: new Date(now + 1000 * 60 * 60 * 24 * 8).toISOString(), amount: 9200.0, currency: 'ETB' },
    { invoiceId: 'ap-005', vendorName: 'Blue Nile Packaging', dueDate: new Date(now - 1000 * 60 * 60 * 24 * 22).toISOString(), amount: 11450.0, currency: 'ETB' },
    { invoiceId: 'ap-006', vendorName: 'East Africa Freight', dueDate: new Date(now - 1000 * 60 * 60 * 24 * 68).toISOString(), amount: 23800.0, currency: 'ETB' },
  ];
  const customerLines = [
    { invoiceId: 'ar-001', customerName: 'Addis Wholesale', dueDate: new Date(now + 1000 * 60 * 60 * 24 * 10).toISOString(), amount: 14000.75, currency: 'ETB' },
    { invoiceId: 'ar-002', customerName: 'Ethio Retail', dueDate: new Date(now - 1000 * 60 * 60 * 24 * 20).toISOString(), amount: 7600.0, currency: 'ETB' },
    { invoiceId: 'ar-003', customerName: 'Bole Traders', dueDate: new Date(now - 1000 * 60 * 60 * 24 * 45).toISOString(), amount: 13250.0, currency: 'ETB' },
    { invoiceId: 'ar-004', customerName: 'Mercato Distributors', dueDate: new Date(now - 1000 * 60 * 60 * 24 * 12).toISOString(), amount: 9800.0, currency: 'ETB' },
    { invoiceId: 'ar-005', customerName: 'Hawassa Chain Stores', dueDate: new Date(now + 1000 * 60 * 60 * 24 * 18).toISOString(), amount: 22100.0, currency: 'ETB' },
  ];
  return {
    tenantId,
    vendorLines,
    customerLines,
    report: computeAgingReport({ vendorLines, customerLines }),
  };
}

export function computeAgingMultiCurrency({ vendorLines = [], customerLines = [], fxRates = {} } = {}) {
  // fxRates: { 'USD': 55.0, 'ETB': 1.0 } mapping to base
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
    const authHeader = req.headers.authorization;
    const decoded = await verifyBearerToken(authHeader);
    if (!decoded) return res.status(401).json({ error: 'Unauthorized' });
    await enforceModuleAccess(decoded || {}, 'finance', 'aging');
    const tenantId = decoded?.tenantId || decoded?.tenant_id || 'production';

    const seeded = buildSeededFinanceAgingData(tenantId);
    return res.status(200).json({ success: true, tenantId, report: seeded.report, data: seeded });
  } catch (err) {
    console.error('[finance/aging] error', err?.message || err);
    return res.status(500).json({ success: false, error: err?.message || 'Internal' });
  }
}
