#!/usr/bin/env node
/**
 * S3 — Accounting local DB seed (per-DB discipline).
 *
 * Plants the finance engine data in `addiscrown_accounting_local` ONLY:
 *   - S3.1 journal entry for a completed warehouse receipt → Dr Inventory /
 *     Cr Accounts Payable (with normalized journal_entry_lines)
 *   - S3.2 tax_transactions: VAT input/output + WHT (rates per Proclamation)
 *   - S3.3 employees with ET salaries (PAYE engine source)
 *   - vendor_bills / customer_invoices already pre-seeded (aging source)
 *
 * Idempotent: DELETE-then-INSERT per reference scope so re-runs are safe.
 *
 * Usage:
 *   node scripts/seed-accounting.local.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DB_NAME = 'addiscrown_accounting_local';
const TENANT = 'tenant_default';

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
const client = new pg.Client({
  host: env.LOCAL_PG_HOST || '127.0.0.1',
  port: Number(env.LOCAL_PG_PORT || 5432),
  user: env.LOCAL_PG_USER,
  password: env.LOCAL_PG_PASSWORD,
  database: DB_NAME,
});

const VAT_INV = 66000 * 0.15; // 9900
const VAT_OUT = 100000 * 0.15; // 15000
const WHT_AMT = Math.round(66000 * 0.02 * 100) / 100; // 1320

async function seed() {
  await client.connect();

  // ---- S3.3 employees (PAYE source) ---------------------------------------
  const employees = [
    ['EMP-001', 'Abebe', 'Kebede', 25000, 'M-7800+'],
    ['EMP-002', 'Sara', 'Girma', 9500, 'M-5250-7800'],
    ['EMP-003', 'Dawit', 'Haile', 4200, 'M-3200-5250'],
  ];
  await client.query(`DELETE FROM employees WHERE tenant_id = $1`, [TENANT]);
  for (const [id, fn, ln, salary] of employees) {
    await client.query(
      `INSERT INTO employees (tenant_id, employee_id, first_name, last_name, salary, tax_bracket, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'active')`,
      [TENANT, id, fn, ln, salary, salary > 7800 ? 'M-7800+' : salary > 5250 ? 'M-5250-7800' : salary > 3200 ? 'M-3200-5250' : 'M-0-3200']
    );
  }
  console.log(`✓ employees seeded (3)`);

  // ---- S3.2 tax_transactions (VAT in/out + WHT) ----------------------------
  await client.query(`DELETE FROM tax_transactions WHERE tenant_id = $1`, [TENANT]);
  const taxRows = [
    // Purchase VAT input @15% (from the real warehouse receipt / PO)
    ['VAT', 'input', VAT_INV, '2026-07', 'warehouse_receipt', 1],
    // Sales VAT output @15%
    ['VAT', 'output', VAT_OUT, '2026-07', 'sales_order', 9001],
    // Withholding tax 2% on supplier payment
    ['WHT', 'withholding', WHT_AMT, '2026-07', 'purchase_order', 1],
  ];
  for (const [tt, tx, amt, period, refType, refId] of taxRows) {
    await client.query(
      `INSERT INTO tax_transactions (tenant_id, tax_type, transaction_type, amount, tax_period, reference_type, reference_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [TENANT, tt, tx, amt, period, refType, refId]
    );
  }
  console.log(`✓ tax_transactions seeded (VAT in=${VAT_INV}, VAT out=${VAT_OUT}, WHT=${WHT_AMT})`);

  // ---- S3.1 journal entry: completed warehouse receipt → Dr Inv / Cr AP -----
  const receiptId = 1; // real warehouse receipt id=1 (portland cement / steel)
  await client.query(
    `DELETE FROM journal_entry_lines WHERE tenant_id = $1 AND journal_entry_id IN
       (SELECT id FROM journal_entries WHERE tenant_id = $1 AND reference_type = 'warehouse_receipt')`,
    [TENANT]
  );
  await client.query(
    `DELETE FROM journal_entries WHERE tenant_id = $1 AND reference_type = 'warehouse_receipt' AND reference_id = $2`,
    [TENANT, receiptId]
  );

  const ins = await client.query(
    `INSERT INTO journal_entries (
       tenant_id, entry_number, entry_date, entry_type, description, status,
       total_debit, total_credit, reference_type, reference_id, debit_account_id, credit_account_id, amount
     ) VALUES ($1, 'JE-2026-WR1', CURRENT_DATE, 'WAREHOUSE_RECEIPT', 'Goods received — inventory & AP recognition', 'posted',
               66000.00, 66000.00, 'warehouse_receipt', $2, 4, 5, 66000.00)
     RETURNING id`,
    [TENANT, receiptId]
  );
  const jeId = ins.rows[0].id;

  await client.query(
    `INSERT INTO journal_entry_lines (tenant_id, journal_entry_id, line_number, account_id, debit_amount, credit_amount, description)
     VALUES ($1, $2, 1, 4, 66000.00, 0.00, 'Inventory (Dr) — goods received on warehouse receipt'),
            ($1, $2, 2, 5, 0.00, 66000.00, 'Accounts Payable (Cr) — payable to supplier')`,
    [TENANT, jeId]
  );
  console.log(`✓ journal entry seeded (JE id=${jeId}, Dr Inventory 66000 / Cr AP 66000)`);

  await client.end();
  console.log(`\n✅ Accounting local seed complete (${DB_NAME})`);
}

seed().catch((e) => {
  console.error('Seed failed:', e.message);
  process.exit(1);
});