#!/usr/bin/env node
import pg from 'pg';
const { Client } = pg;

const ACCOUNTING_DB_URL = process.env.NEON_ACCOUNTING_DB_URL;

if (!ACCOUNTING_DB_URL) {
  console.error('Set NEON_ACCOUNTING_DB_URL in .env.local before running this script (no hardcoded credentials).');
  process.exit(1);
}

async function seedAccountingData() {
  const client = new Client({ connectionString: ACCOUNTING_DB_URL });
  await client.connect();
  
  console.log('Seeding accounting data with Ethiopian-contextualized records...\n');
  
  // Ethiopian Chart of Accounts (ESIC taxonomy)
  const accounts = [
    { account_code: '1000', account_name: 'Cash and Cash Equivalents', account_type: 'Asset', balance: 500000 },
    { account_code: '1100', account_name: 'Accounts Receivable', account_type: 'Asset', balance: 250000 },
    { account_code: '1200', account_name: 'Inventory', account_type: 'Asset', balance: 750000 },
    { account_code: '1300', account_name: 'Property, Plant and Equipment', account_type: 'Asset', balance: 2000000 },
    { account_code: '2000', account_name: 'Accounts Payable', account_type: 'Liability', balance: -150000 },
    { account_code: '2100', account_name: 'VAT Payable (Output)', account_type: 'Liability', balance: -45000 },
    { account_code: '2200', account_name: 'PAYE Payable', account_type: 'Liability', balance: -35000 },
    { account_code: '2300', account_name: 'Pension Payable', account_type: 'Liability', balance: -28000 },
    { account_code: '2400', account_name: 'Withholding Tax Payable', account_type: 'Liability', balance: -15000 },
    { account_code: '3000', account_name: 'Share Capital', account_type: 'Equity', balance: -1000000 },
    { account_code: '3100', account_name: 'Retained Earnings', account_type: 'Equity', balance: -500000 },
    { account_code: '4000', account_name: 'Sales Revenue', account_type: 'Revenue', balance: -2000000 },
    { account_code: '5000', account_name: 'Cost of Goods Sold', account_type: 'Expense', balance: 1200000 },
    { account_code: '5100', account_name: 'Operating Expenses', account_type: 'Expense', balance: 450000 },
    { account_code: '5200', account_name: 'Salaries and Wages', account_type: 'Expense', balance: 350000 }
  ];
  
  console.log('Inserting accounts...');
  for (const account of accounts) {
    await client.query(
      `INSERT INTO accounts (account_code, account_name, account_type, balance, tenant_id) 
       VALUES ($1, $2, $3, $4, 'tenant_default') 
       ON CONFLICT (account_code) DO UPDATE SET 
       account_name = EXCLUDED.account_name, 
       account_type = EXCLUDED.account_type, 
       balance = EXCLUDED.balance`,
      [account.account_code, account.account_name, account.account_type, account.balance]
    );
  }
  console.log(`✓ ${accounts.length} accounts inserted`);
  
  // Journal Entries (Ethiopian tax compliance)
  const journalEntries = [
    { entry_date: '2026-01-15', entry_type: 'Sales Invoice', debit_account_id: 1, credit_account_id: 12, amount: 300000, description: 'Sales to Ethiopian Airlines - VAT 15%' },
    { entry_date: '2026-01-20', entry_type: 'Purchase Invoice', debit_account_id: 3, credit_account_id: 5, amount: 150000, description: 'Raw material purchase from local supplier' },
    { entry_date: '2026-01-25', entry_type: 'PAYE Withholding', debit_account_id: 2, credit_account_id: 7, amount: 45000, description: 'PAYE deduction for January payroll' },
    { entry_date: '2026-01-30', entry_type: 'Pension Contribution', debit_account_id: 2, credit_account_id: 8, amount: 28000, description: 'Employee pension contribution - 11%' },
    { entry_date: '2026-02-05', entry_type: 'WHT Payment', debit_account_id: 5, credit_account_id: 9, amount: 15000, description: 'Withholding tax on service payment' },
    { entry_date: '2026-02-10', entry_type: 'VAT Payment', debit_account_id: 6, credit_account_id: 1, amount: 45000, description: 'VAT payment to ERCA for Q1' },
    { entry_date: '2026-02-15', entry_type: 'Sales Invoice', debit_account_id: 1, credit_account_id: 12, amount: 250000, description: 'Sales to Ethio Telecom - VAT 15%' },
    { entry_date: '2026-02-20', entry_type: 'Salary Payment', debit_account_id: 14, credit_account_id: 1, amount: 350000, description: 'Monthly salary payment' },
    { entry_date: '2026-02-25', entry_type: 'Purchase Invoice', debit_account_id: 3, credit_account_id: 5, amount: 200000, description: 'Equipment purchase' },
    { entry_date: '2026-03-01', entry_type: 'Sales Invoice', debit_account_id: 1, credit_account_id: 12, amount: 400000, description: 'Export sales - VAT exempt' }
  ];
  
  console.log('Inserting journal entries...');
  for (const entry of journalEntries) {
    await client.query(
      `INSERT INTO journal_entries (entry_date, entry_type, debit_account_id, credit_account_id, amount, description, tenant_id) 
       VALUES ($1, $2, $3, $4, $5, $6, 'tenant_default')`,
      [entry.entry_date, entry.entry_type, entry.debit_account_id, entry.credit_account_id, entry.amount, entry.description]
    );
  }
  console.log(`✓ ${journalEntries.length} journal entries inserted`);
  
  // Tax Transactions (Ethiopian tax compliance - Proclamation No. 979/2016)
  const taxTransactions = [
    { transaction_date: '2026-01-31', tax_type: 'VAT', tax_amount: 45000, base_amount: 300000, reference_id: 'INV-001' },
    { transaction_date: '2026-01-31', tax_type: 'PAYE', tax_amount: 35000, base_amount: 350000, reference_id: 'PAYROLL-JAN' },
    { transaction_date: '2026-01-31', tax_type: 'PENSION', tax_amount: 28000, base_amount: 280000, reference_id: 'PENSION-JAN' },
    { transaction_date: '2026-02-05', tax_type: 'WHT', tax_amount: 15000, base_amount: 150000, reference_id: 'PAYMENT-001' },
    { transaction_date: '2026-02-28', tax_type: 'VAT', tax_amount: 37500, base_amount: 250000, reference_id: 'INV-002' },
    { transaction_date: '2026-02-28', tax_type: 'PAYE', tax_amount: 35000, base_amount: 350000, reference_id: 'PAYROLL-FEB' },
    { transaction_date: '2026-02-28', tax_type: 'PENSION', tax_amount: 28000, base_amount: 280000, reference_id: 'PENSION-FEB' },
    { transaction_date: '2026-03-31', tax_type: 'VAT', tax_amount: 0, base_amount: 400000, reference_id: 'INV-003' }, // VAT exempt export
    { transaction_date: '2026-03-31', tax_type: 'PAYE', tax_amount: 38000, base_amount: 380000, reference_id: 'PAYROLL-MAR' },
    { transaction_date: '2026-03-31', tax_type: 'PENSION', tax_amount: 30400, base_amount: 304000, reference_id: 'PENSION-MAR' }
  ];
  
  console.log('Inserting tax transactions...');
  for (const tax of taxTransactions) {
    await client.query(
      `INSERT INTO tax_transactions (transaction_date, tax_type, tax_amount, base_amount, reference_id, tenant_id) 
       VALUES ($1, $2, $3, $4, $5, 'tenant_default')`,
      [tax.transaction_date, tax.tax_type, tax.tax_amount, tax.base_amount, tax.reference_id]
    );
  }
  console.log(`✓ ${taxTransactions.length} tax transactions inserted`);
  
  // Payment Batches
  const paymentBatches = [
    { batch_date: '2026-01-31', total_amount: 108000, status: 'completed' },
    { batch_date: '2026-02-28', total_amount: 100500, status: 'completed' },
    { batch_date: '2026-03-31', total_amount: 68400, status: 'pending' }
  ];
  
  console.log('Inserting payment batches...');
  for (const batch of paymentBatches) {
    await client.query(
      `INSERT INTO payment_batches (batch_date, total_amount, status, tenant_id) 
       VALUES ($1, $2, $3, 'tenant_default')`,
      [batch.batch_date, batch.total_amount, batch.status]
    );
  }
  console.log(`✓ ${paymentBatches.length} payment batches inserted`);
  
  await client.end();
  console.log('\n✅ Accounting data seeded successfully!');
}

seedAccountingData().catch(console.error);
