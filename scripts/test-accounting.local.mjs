#!/usr/bin/env node
/**
 * S3 — Accounting local DB test + finance API E2E (per-DB discipline).
 *
 * Verifies in `addiscrown_accounting_local` (and the finance API):
 *   S3.1 journal engine — warehouse receipt → Dr Inventory / Cr AP; debits == credits
 *   S3.2 VAT 15% + WHT 2% — tax_transactions rates match manual math
 *   S3.3 PAYE + pension brackets — PAE for 25,000 ETB == 7,250.00
 *   S3.4 aging (AP/AR via SQL) + budget-variance reads procurement budgets
 *   S3.5 cash-flow sourced from live ledger
 *
 * Usage:
 *   node scripts/test-accounting.local.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DB_NAME = 'addiscrown_accounting_local';

function loadEnvLocal() {
  const vars = {};
  const envPath = path.join(ROOT, '.env.local');
  if (!fs.existsSync(envPath)) throw new Error('.env.local not found');
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) vars[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
  return vars;
}

const env = loadEnvLocal();
process.env.NEON_ACCOUNTING_DB_URL =
  process.env.NEON_ACCOUNTING_DB_URL ||
  `postgresql://${env.LOCAL_PG_USER || 'ja'}:${env.LOCAL_PG_PASSWORD || 'localdev'}@${env.LOCAL_PG_HOST || '127.0.0.1'}:${env.LOCAL_PG_PORT || 5432}/${DB_NAME}`;
process.env.NEON_PROCUREMENT_DB_URL =
  process.env.NEON_PROCUREMENT_DB_URL ||
  `postgresql://${env.LOCAL_PG_USER || 'ja'}:${env.LOCAL_PG_PASSWORD || 'localdev'}@${env.LOCAL_PG_HOST || '127.0.0.1'}:${env.LOCAL_PG_PORT || 5432}/addiscrown_procurement_local`;

const TENANT = 'tenant_default';
let failures = 0;
function check(name, cond, detail) {
  const ok = Boolean(cond);
  if (!ok) failures += 1;
  console.log(`${ok ? '✅' : '❌'} ${name}${detail ? ' — ' + detail : ''}`);
}

// ---- Direct DB assertions ----------------------------------------------------
const pool = new pg.Pool({ connectionString: process.env.NEON_ACCOUNTING_DB_URL });

// S3.1 journal balance
const je = await pool.query(
  `SELECT total_debit, total_credit, debit_account_id, credit_account_id
   FROM journal_entries WHERE tenant_id = $1 AND reference_type = 'warehouse_receipt'`,
  [TENANT]
);
check('S3.1 journal entry exists (warehouse receipt)', je.rows.length >= 1, `rows=${je.rows.length}`);
if (je.rows[0]) {
  const r = je.rows[0];
  check('S3.1 debits == credits', Number(r.total_debit) === Number(r.total_credit), `dr=${r.total_debit} cr=${r.total_credit}`);
  check('S3.1 Dr Inventory(1500) / Cr AP(2000)', r.debit_account_id === 4 && r.credit_account_id === 5, `dr=${r.debit_account_id} cr=${r.credit_account_id}`);
}

const jel = await pool.query(
  `SELECT count(*)::int AS n FROM journal_entry_lines je
   JOIN journal_entries e ON e.id = je.journal_entry_id
   WHERE je.tenant_id = $1 AND e.reference_type = 'warehouse_receipt'`,
  [TENANT]
);
check('S3.1 journal has normalized lines', jel.rows[0].n >= 2, `lines=${jel.rows[0].n}`);

// S3.2 tax rates
const tax = await pool.query(
  `SELECT tax_type, transaction_type, SUM(amount)::numeric AS amt
   FROM tax_transactions WHERE tenant_id = $1 GROUP BY tax_type, transaction_type`,
  [TENANT]
);
const tv = Object.fromEntries(tax.rows.map((r) => [`${r.tax_type}_${r.transaction_type}`, Number(r.amt)]));
check('S3.2 VAT input = 66000×0.15 = 9900', tv.VAT_input === 9900, `in=${tv.VAT_input}`);
check('S3.2 VAT output = 100000×0.15 = 15000', tv.VAT_output === 15000, `out=${tv.VAT_output}`);
check('S3.2 WHT = 66000×0.02 = 1320', tv.WHT_withholding === 1320, `wht=${tv.WHT_withholding}`);

// S3.3 employees
const emps = await pool.query('SELECT count(*)::int AS n FROM employees WHERE tenant_id=$1 AND status=$2', [TENANT, 'active']);
check('S3.3 employees exist for PAYE', emps.rows[0].n >= 3, `n=${emps.rows[0].n}`);

// S3.4 aging source
const vb = await pool.query('SELECT count(*)::int AS n FROM vendor_bills WHERE tenant_id=$1', [TENANT]);
const ci = await pool.query('SELECT count(*)::int AS n FROM customer_invoices WHERE tenant_id=$1', [TENANT]);
check('S3.4 AP aging source (vendor_bills)', vb.rows[0].n >= 3, `bills=${vb.rows[0].n}`);
check('S3.4 AR aging source (customer_invoices)', ci.rows[0].n >= 3, `inv=${ci.rows[0].n}`);
await pool.end();

// ---- Finance API E2E ----------------------------------------------------------
const { default: handler } = await import('../api/finance.js');
function call(method, url) {
  const req = { method, url, headers: { 'x-tenant-id': 'production' }, query: {} };
  const res = {};
  return new Promise((resolve) => {
    res.status = (c) => { res.__status = c; return res; };
    res.json = (j) => { res.__body = j; resolve(res); };
    res.setHeader = () => {};
    handler(req, res);
  }).then(() => ({ status: res.__status, body: res.__body }));
}

const accounts = await call('GET', '/api/finance/accounts');
check('accounts API returns COA from DB', accounts.body?.count === 12, `count=${accounts.body?.count}`);
const accountsArr = accounts.body?.data;
check('accounts API has inventory account', Array.isArray(accountsArr) && accountsArr.some((a) => a.name === 'Inventory'), 'Inventory present');

const journal = await call('GET', '/api/finance/journal');
check('journal API returns entries', journal.body?.count >= 5, `count=${journal.body?.count}`);

const vat = await call('GET', '/api/finance/vat-returns');
check('VAT returns live (no fallback)', vat.body?.data?.outputVAT === 15000 && vat.body?.data?.inputVAT === 9900,
  `out=${vat.body?.data?.outputVAT} in=${vat.body?.data?.inputVAT} net=${vat.body?.data?.netVATPayable}`);

const taxLiab = await call('GET', '/api/finance/tax-liability');
check('tax-liability computed live', taxLiab.body?.data?.totalLiability > 0, `total=${taxLiab.body?.data?.totalLiability}`);

const paye = await call('GET', '/api/finance/paye-calculations');
const emp25000 = paye.body?.data?.employees?.find((e) => e.monthlySalary === 25000);
check('PAYE 25,000 ETB = 7,250.00', emp25000?.paye === 7250, `paye=${emp25000?.paye}`);
check('PAYE total > 0', paye.body?.data?.totalPAYE > 0, `total=${paye.body?.data?.totalPAYE}`);

const aging = await call('GET', '/api/finance/aging');
check('aging returns AP+AR', aging.body?.report?.summary?.vendorCount >= 3 && aging.body?.report?.summary?.customerCount >= 3,
  `vendors=${aging.body?.report?.summary?.vendorCount} customers=${aging.body?.report?.summary?.customerCount}`);

const budgetVar = await call('GET', '/api/finance/budget-variance');
check('budget-variance reads procurement DB', budgetVar.body?.count >= 1, `count=${budgetVar.body?.count}`);

const forecast = await call('GET', '/api/finance/forecast');
const fc = forecast.body?.data;
check('forecast returns 30-day horizon', fc?.forecast?.length === 30, `days=${fc?.forecast?.length}`);
check('forecast totals live from ledger', fc?.totals?.inflow > 0 && fc?.totals?.outflow > 0,
  `in=${fc?.totals?.inflow} out=${fc?.totals?.outflow} net=${fc?.totals?.net}`);
check('forecast balances accumulate', fc?.forecast?.[fc.forecast.length - 1]?.balance === fc?.totals?.net,
  `lastBal=${fc?.forecast?.[fc.forecast.length - 1]?.balance} net=${fc?.totals?.net}`);

console.log(failures === 0
  ? '\n🎉 S3 accounting ALL PASS'
  : `\n💥 ${failures} failures`);
process.exit(failures === 0 ? 0 : 1);