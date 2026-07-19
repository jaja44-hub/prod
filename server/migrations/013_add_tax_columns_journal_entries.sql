-- Add tax columns to journal_entries table
BEGIN;

ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS vat_amount DECIMAL(15,2) DEFAULT 0.00;
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS withholding_tax_amount DECIMAL(15,2) DEFAULT 0.00;

COMMIT;
