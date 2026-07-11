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

export async function buildSeededFinanceAgingData(tenantId = 'production') {
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
