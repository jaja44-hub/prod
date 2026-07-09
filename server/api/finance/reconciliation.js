import { verifyBearerToken } from '../lib/firebaseAdmin.js';
import { enforceModuleAccess } from '../lib/policyOrchestrator.js';

export function matchPaymentsToInvoices({ invoices = [], payments = [] } = {}) {
  const results = invoices.map((invoice) => {
    // allow fuzzy matching by invoiceId or by PO reference and allow partial payments across currencies with conversion ignored here
    const matchedPayments = payments.filter((payment) => {
      if (payment.currency !== invoice.currency) return false;
      if (payment.invoiceId && payment.invoiceId === invoice.invoiceId) return true;
      if (payment.reference && invoice.reference && payment.reference === invoice.reference) return true;
      return false;
    });
    const totalPaid = matchedPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    return {
      invoiceId: invoice.invoiceId,
      vendorName: invoice.vendorName || invoice.customerName || null,
      currency: invoice.currency,
      invoiceAmount: Number(invoice.amount || 0),
      paidAmount: totalPaid,
      outstandingAmount: Math.max(0, Number(invoice.amount || 0) - totalPaid),
      status: totalPaid >= Number(invoice.amount || 0) ? 'reconciled' : 'open',
      matchedPayments,
    };
  });

  const unmatchedPayments = payments.filter(
    (payment) => !invoices.some((invoice) => (
      (invoice.invoiceId === payment.invoiceId && invoice.currency === payment.currency) ||
      (invoice.reference && payment.reference && invoice.reference === payment.reference)
    ))
  );

  return { results, unmatchedPayments };
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
    if (!decoded) return res.status(401).json({ error: 'Unauthorized' });
    await enforceModuleAccess(decoded || {}, 'finance', 'reconciliation');
    const tenantId = decoded?.tenantId || decoded?.tenant_id || 'production';
    const { invoices, payments } = req.body || {};
    if (!Array.isArray(invoices) || !Array.isArray(payments)) {
      return res.status(400).json({ error: 'Missing invoices or payments arrays' });
    }

    const report = matchPaymentsToInvoices({ invoices, payments });
    return res.status(200).json({ success: true, tenantId, report });
  } catch (err) {
    console.error('[finance/reconciliation] error', err?.message || err);
    return res.status(500).json({ success: false, error: err?.message || 'Internal' });
  }
}
