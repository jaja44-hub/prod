-- 019_hr_employees_enrichment.sql
-- S4.3 / S4.4 — HR module enrichment on the accounting DB `employees` table.
-- The S3 PAYE table only carried payroll fields (salary, tax_bracket). The HR
-- module needs the people-directory fields (email, department, position,
-- hire_date) referenced by API `api/hr.js` and the HRFortress page.
--
-- Per-DB discipline: accounting DB owns payroll + HR employees (seed-codex
-- "Accounting = Ledger, employees, sales, CRM"). Idempotent, non-destructive.

ALTER TABLE employees ADD COLUMN IF NOT EXISTS email        VARCHAR(120);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS department   VARCHAR(60);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS position     VARCHAR(120);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS hire_date    DATE;

-- Backfill the existing 3 employees (S3 PAYE source) with ET-context HR data.
UPDATE employees
   SET email      = 'abebe.kebede@addiscrown.et',
       department = 'Finance',
       position   = 'Senior Accountant',
       hire_date  = '2023-02-01'
 WHERE employee_id = 'EMP-001' AND email IS NULL;

UPDATE employees
   SET email      = 'sara.girma@addiscrown.et',
       department = 'Sales',
       position   = 'Sales Executive',
       hire_date  = '2024-01-15'
 WHERE employee_id = 'EMP-002' AND email IS NULL;

UPDATE employees
   SET email      = 'dawit.haile@addiscrown.et',
       department = 'Operations',
       position   = 'Warehouse Officer',
       hire_date  = '2024-06-10'
 WHERE employee_id = 'EMP-003' AND email IS NULL;