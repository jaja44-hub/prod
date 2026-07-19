-- Phase 4: Tax Liability Fix
BEGIN;

-- Drop and recreate tax_liability table with correct schema
DROP TABLE IF EXISTS tax_liability CASCADE;

CREATE TABLE tax_liability (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  tax_type VARCHAR(50) NOT NULL,
  tax_period VARCHAR(20) NOT NULL,
  tax_amount DECIMAL(18,2) NOT NULL,
  due_date DATE,
  status VARCHAR(20) DEFAULT 'pending',
  reference_type VARCHAR(50),
  reference_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Tax Liability Records from Financial Documents
INSERT INTO tax_liability (tenant_id, tax_type, tax_period, tax_amount, due_date, status, reference_type, reference_id) VALUES
('tenant_default', 'VAT', '2026-02', 0.00, '2026-03-15', 'settled', 'financial_document', 100001),
('tenant_default', 'VAT', '2026-02', 0.00, '2026-03-15', 'settled', 'financial_document', 100002),
('tenant_default', 'VAT', '2026-02', 126975.00, '2026-03-15', 'pending', 'financial_document', 100003),
('tenant_default', 'VAT', '2026-02', 6750.00, '2026-03-15', 'pending', 'financial_document', 100004),
('tenant_default', 'WITHHOLDING', '2026-02', 3795.00, '2026-03-15', 'pending', 'financial_document', 100009),
('tenant_default', 'WITHHOLDING', '2026-03', 2015.38, '2026-04-15', 'pending', 'financial_document', 100010),
('tenant_default', 'WITHHOLDING', '2026-02', 48673.75, '2026-03-15', 'pending', 'financial_document', 100011);

COMMIT;
