-- Phase 4: Finance Integration - Schema
BEGIN;

CREATE TABLE IF NOT EXISTS chart_of_accounts (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  account_code VARCHAR(20) NOT NULL,
  account_name VARCHAR(255) NOT NULL,
  account_type VARCHAR(50) NOT NULL,
  balance_type VARCHAR(10) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(tenant_id, account_code)
);

CREATE TABLE IF NOT EXISTS journal_entries (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  entry_number VARCHAR(50) NOT NULL,
  entry_date DATE NOT NULL,
  entry_type VARCHAR(50) NOT NULL,
  reference_type VARCHAR(50),
  reference_id INTEGER,
  description TEXT,
  status VARCHAR(20) DEFAULT 'posted',
  total_debit DECIMAL(18,2) DEFAULT 0.00,
  total_credit DECIMAL(18,2) DEFAULT 0.00,
  UNIQUE(tenant_id, entry_number)
);

CREATE TABLE IF NOT EXISTS journal_entry_lines (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  journal_entry_id INTEGER NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
  line_number INTEGER NOT NULL,
  account_id INTEGER NOT NULL REFERENCES chart_of_accounts(id),
  debit_amount DECIMAL(18,2) DEFAULT 0.00,
  credit_amount DECIMAL(18,2) DEFAULT 0.00,
  description TEXT,
  UNIQUE(journal_entry_id, line_number)
);

COMMIT;

-- Seed Chart of Accounts
BEGIN;

INSERT INTO chart_of_accounts (id, tenant_id, account_code, account_name, account_type, balance_type) VALUES
(1, 'tenant_default', '1000', 'ASSETS', 'ASSET', 'DEBIT'),
(2, 'tenant_default', '1100', 'Current Assets', 'ASSET', 'DEBIT'),
(3, 'tenant_default', '1110', 'Cash and Cash Equivalents', 'ASSET', 'DEBIT'),
(4, 'tenant_default', '1111', 'Cash on Hand', 'ASSET', 'DEBIT'),
(5, 'tenant_default', '1112', 'Cash at Bank', 'ASSET', 'DEBIT'),
(6, 'tenant_default', '1120', 'Accounts Receivable', 'ASSET', 'DEBIT'),
(7, 'tenant_default', '1130', 'Inventory', 'ASSET', 'DEBIT'),
(8, 'tenant_default', '1200', 'Non-Current Assets', 'ASSET', 'DEBIT'),
(9, 'tenant_default', '1210', 'Property, Plant and Equipment', 'ASSET', 'DEBIT'),
(10, 'tenant_default', '2000', 'LIABILITIES', 'LIABILITY', 'CREDIT'),
(11, 'tenant_default', '2100', 'Current Liabilities', 'LIABILITY', 'CREDIT'),
(12, 'tenant_default', '2110', 'Accounts Payable', 'LIABILITY', 'CREDIT'),
(13, 'tenant_default', '2120', 'VAT Payable', 'LIABILITY', 'CREDIT'),
(14, 'tenant_default', '2130', 'Withholding Tax Payable', 'LIABILITY', 'CREDIT'),
(15, 'tenant_default', '2200', 'Non-Current Liabilities', 'LIABILITY', 'CREDIT'),
(16, 'tenant_default', '3000', 'EQUITY', 'EQUITY', 'CREDIT'),
(17, 'tenant_default', '3100', 'Share Capital', 'EQUITY', 'CREDIT'),
(18, 'tenant_default', '3200', 'Retained Earnings', 'EQUITY', 'CREDIT'),
(19, 'tenant_default', '4000', 'REVENUE', 'REVENUE', 'CREDIT'),
(20, 'tenant_default', '4100', 'Sales Revenue', 'REVENUE', 'CREDIT'),
(21, 'tenant_default', '5000', 'EXPENSES', 'EXPENSE', 'DEBIT'),
(22, 'tenant_default', '5100', 'Cost of Goods Sold', 'EXPENSE', 'DEBIT'),
(23, 'tenant_default', '5200', 'Operating Expenses', 'EXPENSE', 'DEBIT'),
(24, 'tenant_default', '5210', 'Purchases', 'EXPENSE', 'DEBIT'),
(25, 'tenant_default', '5220', 'Salaries and Wages', 'EXPENSE', 'DEBIT'),
(26, 'tenant_default', '5230', 'Utilities', 'EXPENSE', 'DEBIT'),
(27, 'tenant_default', '5240', 'Rent', 'EXPENSE', 'DEBIT');

COMMIT;
