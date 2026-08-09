-- Phase 18: Align accounting local DB with the finance API contract (S3)
-- Targets ONLY `addiscrown_accounting_local` (per-DB discipline).
-- Builds the tables api/finance.js reads: accounts, journal_entry_lines,
-- tax_transactions, employees, and aligns journal_entries.
-- Idempotent: every guard is IF NOT EXISTS / ON CONFLICT safe to re-run.

-- 1. `accounts` — API-driven chart of accounts (mirrors chart_of_accounts) ----
CREATE TABLE IF NOT EXISTS accounts (
  id            SERIAL PRIMARY KEY,
  tenant_id     VARCHAR(255) NOT NULL DEFAULT 'tenant_default',
  account_code  VARCHAR(20)  NOT NULL,
  account_name  VARCHAR(255) NOT NULL,
  account_type  VARCHAR(50)  NOT NULL,
  balance       DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (tenant_id, account_code)
);

-- Seed `accounts` from the existing chart_of_accounts (idempotent).
INSERT INTO accounts (tenant_id, account_code, account_name, account_type, balance, is_active)
SELECT COALESCE(c.tenant_id, 'tenant_default'), c.account_code, c.account_name, c.account_type, 0.00, TRUE
FROM chart_of_accounts c
ON CONFLICT (tenant_id, account_code) DO NOTHING;

-- 2. `journal_entry_lines` — normalized journal line items -------------------
CREATE TABLE IF NOT EXISTS journal_entry_lines (
  id               SERIAL PRIMARY KEY,
  tenant_id        VARCHAR(255) NOT NULL DEFAULT 'tenant_default',
  journal_entry_id INTEGER NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
  line_number      INTEGER NOT NULL,
  account_id       INTEGER NOT NULL,
  debit_amount     DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  credit_amount    DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  description      TEXT,
  UNIQUE (journal_entry_id, line_number)
);

CREATE INDEX IF NOT EXISTS idx_journal_entry_lines_entry ON journal_entry_lines (journal_entry_id);
CREATE INDEX IF NOT EXISTS idx_journal_entry_lines_tenant ON journal_entry_lines (tenant_id);

-- 3. Align `journal_entries` with the finance API's SELECT shape ------------
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS debit_account_id INTEGER;
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS credit_account_id INTEGER;
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS amount DECIMAL(18,2) NOT NULL DEFAULT 0.00;

CREATE INDEX IF NOT EXISTS idx_journal_entries_tenant ON journal_entries (tenant_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_type ON journal_entries (entry_type);

-- 4. `tax_transactions` — VAT / WHT / PAYE ledger rows -----------------------
CREATE TABLE IF NOT EXISTS tax_transactions (
  id               SERIAL PRIMARY KEY,
  tenant_id        VARCHAR(255) NOT NULL,
  tax_type         VARCHAR(20)  NOT NULL,   -- VAT | WHT | PAYE
  transaction_type VARCHAR(20)  NOT NULL,   -- output | input | withholding | paye
  amount           DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  tax_period       VARCHAR(20),
  reference_type   VARCHAR(50),
  reference_id     INTEGER,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tax_transactions_tenant_type ON tax_transactions (tenant_id, tax_type);
CREATE INDEX IF NOT EXISTS idx_tax_transactions_period ON tax_transactions (tax_period);

-- 5. `employees` — PAYE engine source ----------------------------------------
CREATE TABLE IF NOT EXISTS employees (
  id           SERIAL PRIMARY KEY,
  tenant_id    VARCHAR(255) NOT NULL,
  employee_id  VARCHAR(50)  NOT NULL,
  first_name   VARCHAR(100) NOT NULL,
  last_name    VARCHAR(100) NOT NULL,
  salary       DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  tax_bracket  VARCHAR(20),
  status       VARCHAR(20)  NOT NULL DEFAULT 'active',
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (tenant_id, employee_id)
);

CREATE INDEX IF NOT EXISTS idx_employees_tenant_status ON employees (tenant_id, status);