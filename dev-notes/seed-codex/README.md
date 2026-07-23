# Seed Script Codex - SSOT for Neon Database Seeding

**Purpose:** Production-ready seed scripts for Neon PostgreSQL databases. Battle-tested and idempotent.

## Database Architecture

| Database | Purpose | Env Var |
|----------|---------|----------|
| Accounting | Ledger, employees, sales, CRM | NEON_ACCOUNTING_DB_URL |
| Procurement | Suppliers, POs, requisitions | NEON_PROCUREMENT_DB_URL |
| Analytics | Inventory, locations, transactions | NEON_ANALYTICS_DB_URL |
| TenantFinance | Tenant billing, subscriptions | NEON_TENANTFINANCE_DB_URL |

## Seed Scripts

### 1. Accounting (seed-accounting-data.mjs)
- 14 ESIC-compliant Chart of Accounts
- 10 Journal Entries with Ethiopian tax (VAT 15%, PAYE, Pension, WHT)
- Double-entry accounting principles
- Usage: `node scripts/seed-accounting-data.mjs`

### 2. Analytics (seed-analytics-data.mjs)
- 6 Ethiopian warehouse locations
- 8 inventory products with Ethiopian context
- Inventory transactions
- Usage: `node scripts/seed-analytics-data.mjs`

### 3. Sales/HR/CRM (seed-sales-hr-crm-data.mjs)
- 10 employees with tax brackets
- 10 sales orders
- 10 CRM opportunities
- 5 customers
- Usage: `node scripts/seed-sales-hr-crm-data.mjs`

### 4. Procurement (seed-procurement-data.mjs)
- 8 Ethiopian suppliers
- 8 purchase orders
- Usage: `node scripts/seed-procurement-data.mjs`

## Migration Guide

When migrating to a new database:
1. Update the DB_URL in the script
2. Run the script - it's idempotent (ON CONFLICT handling)
3. Verify data via API endpoints

## Key Features

- All scripts use `ON CONFLICT DO NOTHING/UPDATE` for safety
- Ethiopian-contextualized data
- Tenant-aware with `tenant_id`
- Can be run multiple times safely
