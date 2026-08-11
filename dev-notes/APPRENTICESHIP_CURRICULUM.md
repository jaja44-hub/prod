# Addis Crown ERP — Apprenticeship Curriculum

**Goal:** Take you from a non-technical vibe coder (familiar with ERP operations & compliance) to a **medium-technical developer** who can independently navigate pgAdmin, understand every database module, validate data manually, write/test SQL, run seeders, trace UI ↔ Backend ↔ DB sync lines, and deliver a full-stack project with a hosted UI in production.

**Learning style:** Each phase builds on the previous one. You'll work in **your own local databases** (pgAdmin + psql) against **your own real project** — not toy examples. AI assistance is woven into every phase for guided exploration.

---

## 📋 Phase Map

| Phase | Title | Focus | Duration |
|---|---|---|---|
| 1 | pgAdmin First-Timer Navigation | Sidebar, tree explorer, query tool, data entry | 1 session |
| 2 | Understanding the 5 Local Databases | What each DB holds, why 4 module DBs exist | 1 session |
| 3 | Manual Table Creation & Data Entry | CREATE TABLE, INSERT, ALTER TABLE in pgAdmin | 1–2 sessions |
| 4 | Testing Computed Outputs & SQL Compatibility | SELECT queries, aggregations, JOINs, rule validation | 1–2 sessions |
| 5 | Inter-Module Communication Lines | How modules exchange data (accounting → analytics, procurement → inventory) | 1 session |
| 6 | Script-Based Data Persistence | Running seeders, understanding `seed-neon-local.mjs`, writing custom scripts | 1–2 sessions |
| 7 | UI ↔ Backend ↔ Database Sync | Tracing Vite → Vercel serverless → Neon/local DB | 1–2 sessions |
| 8 | API Matching & End-to-End Validation | Testing API endpoints, validating full-stack flows | 1–2 sessions |

---

## Phase 1: pgAdmin First-Timer Navigation

### 1.1 Launching pgAdmin
- Open pgAdmin 4 from your applications menu or run `pgadmin4` from terminal.
- The first time, you'll set a **master password** (you already reset yours — remember it).
- The master password encrypts saved server passwords in pgAdmin's local SQLite DB. It does NOT affect any database server — only pgAdmin's own credential vault.

### 1.2 The pgAdmin Interface (left-to-right tour)

#### Left Sidebar — Browser Panel
This is your **file explorer equivalent** for databases. It mirrors VS Code's Explorer sidebar.

```
Servers
  └── Local Addis Crown  ← the server you'll register (see Phase 1.3)
        └── Databases
              ├── addiscrown_local          ← main DB (10 tables)
              ├── addiscrown_accounting_local
              ├── addiscrown_procurement_local
              ├── addiscrown_analytics_local
              └── addiscrown_tenantfinance_local
        └── Login/Group Roles
        └── Tablespaces
```

**How to expand/collapse:** Click the ▶ arrow next to each node. This is exactly like expanding a folder in VS Code's Explorer.

#### Top Menu Bar
| Menu | What it does (VS Code equivalent) |
|---|---|
| **File** | New query window (like `Ctrl+N` in VS Code), import/export |
| **Tools** | Maintenance, backup/restore, configuration |
| **View** | Show/hide panels (like VS Code's View menu) |
| **Help** | Documentation, about |

#### Main Workspace (center)
This is where you write and execute SQL — equivalent to VS Code's editor panel.

#### Output / Messages Panel (bottom)
Shows query results, execution time, row counts — equivalent to VS Code's Terminal panel.

### 1.3 Registering the Local Addis Crown Server (do this once)

1. Right-click **Servers** in the left sidebar → **Register** → **Server...**
2. **General tab:**
   - Name: `Local Addis Crown`
3. **Connection tab:**
   - Host: `127.0.0.1`
   - Port: `5432`
   - Maintenance database: `addiscrown_local`
   - Username: `ja`
   - Password: `localdev`
   - ✅ Check **"Save password?"**
4. Click **Save**.
5. Expand **Servers → Local Addis Crown → Databases** — you'll see all 5 databases.
6. Expand any database → **Schemas** → **public** → **Tables** — you'll see the tables.

### 1.4 The Query Tool (your SQL editor)

1. Right-click any database (e.g., `addiscrown_local`) → **Query Tool**.
2. A SQL editor opens in the main workspace — this is your VS Code editor for SQL.
3. Type a query, then click the **▶ Execute** button (or press `F5`).
4. Results appear in the **Data Output** tab at the bottom.

**Try it now (your first query):**
```sql
SELECT current_database(), current_user, version();
```
Click ▶ Execute. You should see the result grid.

### 1.5 Browsing Table Data (like VS Code's file preview)

1. Expand **Servers → Local Addis Crown → Databases → addiscrown_local → Schemas → public → Tables**.
2. Right-click any table (e.g., `suppliers`) → **View/Edit Data** → **All Rows**.
3. A spreadsheet-like grid opens — this is your **data viewer**, equivalent to opening a JSON file in VS Code to see its contents.
4. You can **edit cells directly** in this grid (double-click a cell, change the value, click the ✅ Save button). This is how you manually enter and update data — like editing a value in a spreadsheet.

### 1.6 pgAdmin's AI Integration Points

pgAdmin 4 (v9.x) has **AI-assisted features**:
- **AI Query Assistant** (if enabled): A chat-like panel where you can describe what data you want in natural language, and pgAdmin generates the SQL for you.
- **How to access:** Look for an AI/chat icon in the toolbar or under **Tools → AI Query Assistant**.
- **What it does:** You type "show me suppliers with pending purchase orders" and it generates the SQL query automatically.
- **Limitation:** The AI runs locally or connects to a cloud provider — it does NOT use your OpenRouter key by default. You'd need to configure an AI backend in pgAdmin's preferences if you want to connect it to your OpenRouter setup.

### 1.7 pgAdmin Developer Tools (like VS Code's DevTools)

| pgAdmin Tool | VS Code Equivalent | What It Shows |
|---|---|---|
| **Query Tool** | Editor | SQL editor with syntax highlighting |
| **Data Output** | Terminal | Query results in grid/JSON/text format |
| **Explain/Analyze** | Debugger | Query execution plan (how Postgres executes your SQL) |
| **Schema Diff** | Diff editor | Compare two database schemas visually |
| **Backup/Restore** | File → Save/Load | Export/import database dumps |
| **Error Logs** | Problems panel | pgAdmin and server error logs |

### 1.8 Key pgAdmin Settings to Know

Open **File → Preferences** (like VS Code's Settings `Ctrl+,`):
- **SQL Editor:** Tab size, syntax highlighting, auto-completion
- **Browser:** Tree view behavior, confirmation dialogs
- **Connections:** Connection timeout, SSL settings
- **Master Password:** Change or reset (you already did this)

---

## Phase 2: Understanding the 5 Local Databases

### 2.1 The Database Landscape

Your project has **5 local databases**, each serving a distinct purpose:

| Database | Purpose | Tables | Neon Counterpart |
|---|---|---|---|
| `addiscrown_local` | Main/seed database (all 10 ERP tables) | 10 tables | Primary Neon DB |
| `addiscrown_accounting_local` | Accounting module | chart_of_accounts, journal_entries, vendor_bills, customer_invoices | `neon_accounting_db` |
| `addiscrown_procurement_local` | Procurement module | suppliers, purchase_orders, warehouse_receipts | `neon_procurement_db` |
| `addiscrown_analytics_local` | Analytics module | sales_analytics, warehouse_metrics, inventory_products, inventory_transactions | `neon_analytics_db` |
| `addiscrown_tenantfinance_local` | Tenant Finance module | customers, sales_orders, crm_opportunities | `neon_tenantfinance_db` |

### 2.2 Why 4 Module Databases?

In the **Neon free-tier** architecture, each module gets its own database to stay within CPU/storage limits. This is a deliberate design choice:

- **Isolation:** Accounting data is separate from procurement data. A spike in analytics queries doesn't affect accounting transactions.
- **Compliance:** Financial modules (accounting, tenant finance) can have stricter access controls and audit trails.
- **Scalability:** Each module can scale independently on Neon's cloud infrastructure.
- **Free-tier optimization:** By splitting across 4 databases, each stays within the free-tier's per-database limits.

### 2.3 The Module ↔ Table Mapping (detailed)

#### Accounting Module (`addiscrown_accounting_local`)
| Table | Purpose | Key Columns | ERP Role |
|---|---|---|---|
| `chart_of_accounts` | All ledger accounts (assets, liabilities, equity, revenue, expenses) | account_code, account_name, account_type, balance_type | Double-entry bookkeeping foundation |
| `journal_entries` | Individual transactions (sales invoices, purchase orders) | entry_number, entry_type, total_debit, total_credit | Records every financial transaction |
| `vendor_bills` | Bills owed to suppliers (accounts payable) | invoice_id, vendor_name, due_date, amount | Tracks what you owe |
| `customer_invoices` | Invoices sent to customers (accounts receivable) | invoice_id, customer_name, due_date, amount | Tracks what customers owe you |

**ACID guarantee:** Accounting requires full ACID compliance — every transaction is all-or-nothing, consistent, isolated, and durable.

#### Procurement Module (`addiscrown_procurement_local`)
| Table | Purpose | Key Columns | ERP Role |
|---|---|---|---|
| `suppliers` | Supplier master data | supplier_code, name, email, phone, country | Who you buy from |
| `purchase_orders` | Purchase orders to suppliers | po_number, supplier_id, total_amount, status | What you've ordered |
| `warehouse_receipts` | Goods received from suppliers | receipt_number, po_id, status | What actually arrived |

**Key relationship:** `purchase_orders.supplier_id` → `suppliers.id` (foreign key relationship). `warehouse_receipts.po_id` → `purchase_orders.po_number` (what was ordered vs. what was received).

#### Analytics Module (`addiscrown_analytics_local`)
| Table | Purpose | Key Columns | ERP Role |
|---|---|---|---|
| `sales_analytics` | Aggregated sales data for BI | order_id, amount_total, partner_name | Sales performance tracking |
| `warehouse_metrics` | Warehouse operations KPIs | picking_id, picking_type, state, scheduled_date | Warehouse efficiency |
| `inventory_products` | Product stock levels (synced from Firebase) | sku, name, quantity, unit_price | Real-time inventory |
| `inventory_transactions` | Stock movement history | product_id, transaction_type, quantity | Audit trail of all stock changes |

**Key insight:** Analytics tables are designed for **aggregation and reporting** — they denormalize data from the procurement and inventory modules for fast dashboard queries.

#### Tenant Finance Module (`addiscrown_tenantfinance_local`)
| Table | Purpose | Key Columns | ERP Role |
|---|---|---|---|
| `customers` | Customer master data | customer_code, name, credit_limit | Who buys from you |
| `sales_orders` | Sales orders to customers | order_number, customer_id, total_amount, payment_status | What you've sold |
| `crm_opportunities` | Sales pipeline opportunities | name, expected_value, status | What you might sell |

**Key relationship:** `sales_orders.customer_id` → `customers.customer_code`. `crm_opportunities` feeds into `sales_orders` when an opportunity converts.

### 2.4 How the 5 Databases Relate (Communication Lines)

```
                    ┌─────────────────────────────────────────┐
                    │         addiscrown_local (main)         │
                    │  10 tables: suppliers, purchase_orders,  │
                    │  sales_orders, chart_of_accounts, etc.   │
                    └────────────┬────────────────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│  accounting     │  │  procurement        │  │  tenantfinance      │
│  (4 tables)     │  │  (3 tables)         │  │  (3 tables)         │
│                 │  │                     │  │                     │
│ ← journal_      │  │ ← suppliers         │  │ ← customers         │
│   entries from  │  │ ← purchase_orders   │  │ ← sales_orders      │
│   main DB       │  │ ← warehouse_receipts│  │ ← crm_opportunities │
│                 │  │                     │  │                     │
│ → vendor_bills  │  │ → inventory sync →  │  │ → payment tracking  │
│   & customer_   │  │   analytics module  │  │   in analytics      │
│   invoices      │  │                     │  │                     │
└────────┬────────┘  └──────────┬──────────┘  └──────────┬──────────┘
         │                      │                       │
         ▼                      ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    analytics module                             │
│  (4 tables: sales_analytics, warehouse_metrics,                │
│   inventory_products, inventory_transactions)                   │
│                                                                 │
│  Receives data FROM:                                          │
│    • procurement → inventory sync (products + transactions)    │
│    • tenantfinance → sales data (for BI dashboards)            │
│    • accounting → financial aggregates (revenue, payables)     │
│                                                                 │
│  Feeds back TO:                                               │
│    • UI dashboards (via Firestore → Realtime DB)               │
│    • CEO/executive reports                                     │
└─────────────────────────────────────────────────────────────────┘
```

**Key communication patterns:**
1. **Main DB → Accounting:** Journal entries are created in the main DB, then replicated to the accounting DB for detailed financial tracking.
2. **Procurement → Analytics:** Inventory sync pushes product data and transactions to the analytics module for BI dashboards.
3. **Tenant Finance → Analytics:** Sales data flows to analytics for executive dashboards.
4. **Accounting ↔ Tenant Finance:** Invoices (customer_invoices ↔ sales_orders) and bills (vendor_bills ↔ purchase_orders) cross-reference each other.

---

## Phase 3: Manual Table Creation & Data Entry

### 3.1 Creating a Table in pgAdmin (GUI)

1. Expand **Servers → Local Addis Crown → Databases → addiscrown_local → Schemas → public → Tables**.
2. Right-click **Tables** → **Create** → **Table...**
3. **General tab:**
   - Name: `test_manual_table`
4. **Columns tab:** Click **Add** to add columns:
   - Column 1: `id` → Type: `integer` → Primary key ✅
   - Column 2: `name` → Type: `text` → Not null ✅
   - Column 3: `created_at` → Type: `timestamp` → Default: `CURRENT_TIMESTAMP`
5. **Constraints tab:** Add primary key constraint on `id`.
6. Click **Save**.
7. The table now appears in the Tables list — like creating a new file in VS Code's Explorer.

### 3.2 Inserting Data via the Data Grid

1. Right-click the new table → **View/Edit Data** → **All Rows**.
2. Click the **✚ Add Row** button (or press `Ctrl+Enter` in some versions).
3. Fill in values:
   - `id`: `1`
   - `name`: `Test Entry`
   - `created_at`: (auto-filled with current timestamp)
4. Click the **💾 Save** button (or press `Ctrl+S`).
5. The row now appears in the grid — like saving a file in VS Code.

### 3.3 Creating a Table via SQL (Query Tool)

1. Right-click `addiscrown_local` → **Query Tool**.
2. Type:
```sql
CREATE TABLE IF NOT EXISTS test_sql_table (
    id SERIAL PRIMARY KEY,
    item_name VARCHAR(100) NOT NULL,
    quantity INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
3. Click ▶ Execute (or press `F5`).
4. Check the **Messages** tab at the bottom — you should see `CREATE TABLE`.

### 3.4 Inserting Data via SQL

In the same Query Tool:
```sql
INSERT INTO test_sql_table (item_name, quantity) VALUES
    ('Widget A', 100),
    ('Widget B', 50),
    ('Widget C', 25);
```
Click ▶ Execute. Check the Messages tab for `INSERT 0 3` (3 rows inserted).

### 3.5 Verifying the Data

```sql
SELECT * FROM test_sql_table;
```
You should see a grid with your 3 rows. This is the same as opening a file in VS Code to verify its contents.

### 3.6 Altering a Table (Adding a Column)

```sql
ALTER TABLE test_sql_table ADD COLUMN price DECIMAL(10,2) DEFAULT 0;
```
Then update values:
```sql
UPDATE test_sql_table SET price = 9.99 WHERE item_name = 'Widget A';
```
Verify:
```sql
SELECT item_name, quantity, price FROM test_sql_table;
```

### 3.7 Dropping a Table (Cleanup)

```sql
DROP TABLE IF EXISTS test_manual_table;
DROP TABLE IF EXISTS test_sql_table;
```

---

## Phase 4: Testing Computed Outputs & SQL Compatibility

### 4.1 Basic Aggregations (like VS Code's Find/Replace but for data)

```sql
-- Total sales
SELECT SUM(total_amount) AS total_sales FROM sales_orders;

-- Count by status
SELECT status, COUNT(*) AS count FROM sales_orders GROUP BY status;

-- Average order value
SELECT AVG(total_amount) AS avg_order FROM sales_orders WHERE status = 'done';

-- Top customer by spend
SELECT customer_name, SUM(total_amount) AS total_spent
FROM sales_orders
GROUP BY customer_name
ORDER BY total_spent DESC
LIMIT 1;
```

### 4.2 JOINs (connecting related tables)

```sql
-- Join sales_orders with customers
SELECT so.order_number, so.total_amount, c.name AS customer_name, c.credit_limit
FROM sales_orders so
JOIN customers c ON so.customer_id = c.customer_code
WHERE so.status = 'done';
```

### 4.3 SQL Syntax Compatibility Checks

Different databases have different SQL dialects. Here's what's **PostgreSQL-specific** vs **standard SQL**:

| Feature | PostgreSQL | Standard SQL | Compatible? |
|---|---|---|---|
| `SERIAL` auto-increment | ✅ `id SERIAL PRIMARY KEY` | `AUTO_INCREMENT` (MySQL) | ❌ MySQL uses `AUTO_INCREMENT` |
| `CURRENT_DATE` | ✅ | ✅ | ✅ Standard |
| `DECIMAL(15,2)` | ✅ | ✅ | ✅ Standard |
| `JSONB` data type | ✅ | ❌ (MySQL has `JSON`) | ❌ MySQL uses `JSON` |
| `ON CONFLICT DO NOTHING` | ✅ | ❌ (MySQL uses `ON DUPLICATE KEY UPDATE`) | ❌ MySQL different syntax |
| `IF NOT EXISTS` in CREATE TABLE | ✅ | ✅ | ✅ Standard |
| `VARCHAR(50)` | ✅ | ✅ | ✅ Standard |
| `TIMESTAMP DEFAULT CURRENT_TIMESTAMP` | ✅ | ✅ | ✅ Standard |

**Key takeaway:** Your seed scripts use PostgreSQL-specific syntax (`SERIAL`, `JSONB`, `ON CONFLICT`). These would NOT work on MySQL or SQLite without modification. This is why the project uses Postgres everywhere (local + Neon).

### 4.4 Testing Data Integrity Rules

```sql
-- Test: Can we insert a purchase order with a negative amount? (should fail if we add a constraint)
INSERT INTO purchase_orders (po_number, total_amount, status) VALUES ('PO-TEST', -100, 'draft');
-- This WILL succeed unless we add a CHECK constraint

-- Add a CHECK constraint to prevent negative amounts
ALTER TABLE purchase_orders ADD CONSTRAINT chk_positive_amount CHECK (total_amount > 0);

-- Now try again — this should FAIL
INSERT INTO purchase_orders (po_number, total_amount, status) VALUES ('PO-TEST2', -100, 'draft');
-- ERROR: new row for relation "purchase_orders" violates check constraint "chk_positive_amount"
```

### 4.5 Testing Unique Constraints

```sql
-- Try inserting a duplicate supplier code
INSERT INTO suppliers (id, supplier_code, name) VALUES ('sup-dup', 'SUP-001', 'Duplicate Supplier');
-- ERROR: duplicate key value violates unique constraint "suppliers_pkey" or "suppliers_supplier_code_key"
```

---

## Phase 5: Inter-Module Communication Lines

### 5.1 Understanding the Data Flow

The 4 module databases communicate through **explicit sync points** — not through direct database links. Here's how:

#### Procurement → Analytics (Inventory Sync)
When a purchase order is received (warehouse_receipts), the inventory counts in the analytics module update:
1. `warehouse_receipts` gets a new receipt (status: `pending` → `matched`)
2. A sync script reads the receipt and updates `inventory_products` in the analytics DB
3. `inventory_transactions` in the analytics DB records the movement

#### Accounting → Analytics (Financial Aggregation)
1. `journal_entries` in accounting DB records a sales invoice
2. An analytics sync reads the journal entry and updates `sales_analytics` in the analytics DB
3. The analytics DB aggregates revenue by period, customer, product

#### Tenant Finance → Accounting (Invoice Cross-Reference)
1. `customer_invoices` in accounting DB references a customer from tenantfinance
2. `vendor_bills` in accounting DB references a supplier from procurement
3. Payment status in tenantfinance's `sales_orders` links back to accounting's `customer_invoices`

### 5.2 Tracing a Real Data Flow

Let's trace what happens when a customer places an order:

```
1. TENANT FINANCE: crm_opportunities → sales_orders (order placed)
2. PROCUREMENT: purchase_orders created for raw materials (if needed)
3. WAREHOUSE: warehouse_receipts created when materials arrive
4. ANALYTICS: inventory_products updated with new stock levels
5. ACCOUNTING: journal_entries created for the sale (revenue recorded)
6. ACCOUNTING: customer_invoices created (what the customer owes)
7. ANALYTICS: sales_analytics updated with the order amount
8. UI: Firestore sync pushes updates to the dashboard in real-time
```

### 5.3 Testing Cross-Module Queries

Since all 4 module databases are on the same local Postgres server, you can query across them:

```sql
-- Cross-module query: Show sales orders with customer credit limits
-- (tenantfinance → accounting)
SELECT
    so.order_number,
    so.total_amount,
    so.status,
    c.credit_limit,
    CASE WHEN so.total_amount <= c.credit_limit THEN 'OK' ELSE 'OVER LIMIT' END AS credit_check
FROM addiscrown_tenantfinance_local.sales_orders so
JOIN addiscrown_tenantfinance_local.customers c ON so.customer_id = c.customer_code;
```

**Note:** Cross-database queries in PostgreSQL require the `dblink` extension or `postgres_fdw` (foreign data wrapper). For now, the sync scripts handle cross-module data flow at the application level, not at the SQL level.

---

## Phase 6: Script-Based Data Persistence

### 6.1 Understanding the Seeder Architecture

The project has two seeders:

| Seeder | What It Does | When to Use |
|---|---|---|
| `seed-neon-local.mjs` | Seeds the main `addiscrown_local` DB (10 tables) | When you need the full ERP dataset locally |
| `scripts/seed-local-modules.mjs` | Seeds the 4 module databases (accounting, procurement, analytics, tenantfinance) | When you need module-specific isolated databases |

### 6.2 Running the Main Seeder

```bash
set -a; source .env.local; set +a; node seed-neon-local.mjs
```

This reads `DATABASE_URL` from `.env.local` (pointing to `addiscrown_local`) and creates + seeds all 10 tables.

### 6.3 Running the Module Seeder

```bash
node scripts/seed-local-modules.mjs
```

This seeds all 4 module databases with their appropriate tables and data.

### 6.4 Understanding the Seeder Code

Open `seed-neon-local.mjs` in VS Code (like opening any source file):
- **Lines 1-30:** Imports and configuration (`Pool`, `DATABASE_URL`, `TENANT`)
- **Lines 32-130:** `CREATE TABLE IF NOT EXISTS` statements for each table
- **Lines 132+:** `INSERT INTO ... ON CONFLICT DO NOTHING` seed data

The `ON CONFLICT DO NOTHING` clause means:
- If the table already has data, re-running the seeder won't create duplicates.
- If you've added custom test rows, they won't be deleted — only missing seed rows will be added.
- This makes seeders **idempotent** (safe to run multiple times).

### 6.5 Writing Your Own Seeder Script

Create a file `scripts/my-custom-seeder.mjs`:

```javascript
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
    connectionString: 'postgresql://ja:localdev@127.0.0.1:5432/addiscrown_local',
    ssl: false,
    max: 2,
});

async function main() {
    // Create a custom table
    await pool.query(`
        CREATE TABLE IF NOT EXISTS my_custom_data (
            id SERIAL PRIMARY KEY,
            key VARCHAR(50) UNIQUE NOT NULL,
            value TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Insert test data
    await pool.query(`
        INSERT INTO my_custom_data (key, value) VALUES
        ('test_key_1', 'Hello from my custom seeder!'),
        ('test_key_2', 'This is test data for learning')
        ON CONFLICT (key) DO NOTHING
    `);

    console.log('✅ Custom seeder completed');
    await pool.end();
}

main();
```

Run it:
```bash
node scripts/my-custom-seeder.mjs
```

Verify in pgAdmin: expand `addiscrown_local → Schemas → public → Tables` — you'll see `my_custom_data`.

### 6.6 The `neonClient.js` Pattern (How the App Connects to DB)

Open `server/api/lib/neonClient.js`:
```javascript
import pg from 'pg';
const { Pool } = pg;

let pool = null;

function getNeonPool() {
    if (pool) return pool;
    const connectionString = process.env.NEON_DATABASE_URL;
    // ... creates a Pool with the connection string
}

export async function queryNeon(text, params = []) {
    const pool = getNeonPool();
    // ... executes query and returns results
}
```

**Key insight:** The app uses a **connection pool** (not a single connection). This is the standard pattern for serverless/backend apps — it reuses connections efficiently instead of creating a new one per query.

---

## Phase 7: UI ↔ Backend ↔ Database Sync

### 7.1 The Three-Tier Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  TIER 1: UI (Vite + React + MUI)                           │
│  - User clicks buttons, sees dashboards                     │
│  - Sends HTTP requests to Vercel serverless functions       │
│  - Subscribes to Firestore for real-time updates            │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP / WebSocket
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  TIER 2: Backend (Vercel Serverless + Express Server)       │
│  - `api/*.js` — Vercel serverless functions                 │
│  - `server/index.js` — Express server for persistent tasks  │
│  - Reads `NEON_DATABASE_URL` from environment variables     │
│  - Calls `queryNeon()` to execute SQL on Neon/Postgres      │
└──────────────────────┬──────────────────────────────────────┘
                       │ SQL queries over SSL
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  TIER 3: Database (Neon Postgres / Local Postgres)          │
│  - Stores all ERP data in relational tables                 │
│  - Enforces ACID transactions for financial data            │
│  - Returns query results to the backend                     │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 Tracing a Real Request End-to-End

**Scenario:** User opens the dashboard and sees total revenue.

1. **UI (React):** Component mounts, calls `fetch('/api/finance/dashboard')`
2. **Backend (Vercel function):** `api/finance.js` receives the request
3. **Backend calls DB:** `queryNeon('SELECT SUM(amount) FROM journal_entries WHERE entry_type = $1', ['Sales Invoice'])`
4. **Database (Neon/local):** Executes the SQL, returns the sum
5. **Backend returns to UI:** `{ totalRevenue: 3979000 }`
6. **UI renders:** Dashboard shows "$3,979,000"

### 7.3 How Firebase Fits In

The project also uses Firebase (Firestore + Realtime Database) for:
- **Real-time sync:** UI subscribes to Firestore for live dashboard updates
- **Inventory sync:** Firebase Realtime DB → Neon Analytics DB (via `firebase-bridge.js`)
- **HR attendance:** Firebase Realtime DB → Firestore for analytics

The Firebase bridge (`api/firebase-bridge.js`) reads from Firebase and writes computed results to Neon DB.

### 7.4 The Vercel Serverless Limit (12 functions)

Vercel's free tier allows **12 serverless functions**. The project has these functions:

| Function | File | Purpose |
|---|---|---|
| finance | `api/finance.js` | Financial queries |
| sales | `api/sales.js` | Sales order operations |
| crm | `api/crm.js` | CRM operations |
| hr | `api/hr.js` | HR/attendance operations |
| inventory | `api/inventory.js` | Inventory operations |
| purchase | `api/purchase.js` | Purchase order operations |
| analytics | `api/analytics.js` | Analytics queries |
| dashboard | `api/dashboard.js` | Dashboard aggregation |
| firebase-bridge | `api/firebase-bridge.js` | Firebase ↔ Neon sync |
| odooProxy | `api/odooProxy.js` | Odoo XML-RPC proxy |
| keepAlive | `api/keepAlive.js` | Keep Neon DB awake |
| seed_neon | `api/seed_neon.js` | Seed Neon tables |

**That's exactly 12 functions** — the free-tier limit. Each function handles a specific module's API needs.

**How to stay within limits:**
- Consolidate related operations into single functions (e.g., `api/finance.js` handles both revenue queries and invoice creation)
- Use Firestore triggers instead of separate scheduled functions for periodic syncs
- Batch operations to reduce the number of function invocations per user action

---

## Phase 8: API Matching & End-to-End Validation

### 8.1 Understanding the API Layer

Each `api/*.js` file is a **Vercel serverless function** that:
1. Receives an HTTP request (GET/POST/PUT/DELETE)
2. Parses query parameters or request body
3. Connects to the appropriate Neon DB (via `getPool(dbType)`)
4. Executes SQL queries
5. Returns JSON response

### 8.2 Testing APIs Locally

You can test APIs against your local database:

```bash
# Start the local Express server (reads .env.local)
set -a; source .env.local; set +a; npm run dev

# In another terminal, test an endpoint
curl http://localhost:3000/api/finance/dashboard
```

### 8.3 Testing APIs Against Remote Neon

For production testing, the same endpoints connect to Neon:

```bash
# Uses .env (remote Neon credentials)
npm run dev
curl http://localhost:3000/api/finance/dashboard
```

### 8.4 Validating End-to-End Flows

**Flow 1: Create a Sales Order → Generate Invoice → Update Analytics**

1. In pgAdmin, insert a new `sales_order` in `addiscrown_tenantfinance_local`
2. Verify the `customer_id` exists in `customers` table
3. Check that `total_amount` is positive (data integrity)
4. Run the analytics sync script to propagate to `addiscrown_analytics_local.sales_analytics`
5. Query the analytics DB to confirm the new order appears in BI data
6. Check the UI dashboard (if running) to see the updated revenue figure

**Flow 2: Receive Warehouse Goods → Update Inventory → Record Accounting Entry**

1. Insert a `warehouse_receipt` in `addiscrown_procurement_local`
2. Run inventory sync to update `addiscrown_analytics_local.inventory_products`
3. Insert a `journal_entry` in `addiscrown_accounting_local` for the inventory receipt
4. Verify the accounting entry has matching debit and credit amounts
5. Check that the inventory quantity in analytics matches the receipt quantity

### 8.5 SQL Rule Compatibility Checklist

When writing SQL for the project, check these rules:

| Rule | Check | Example |
|---|---|---|
| All tables have `tenant_id` column | ✅ | `tenant_id VARCHAR(50) DEFAULT 'tenant_default'` |
| All tables have `created_at` timestamp | ✅ | `created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP` |
| Primary keys use appropriate types | ✅ | `SERIAL` for auto-increment, `VARCHAR` for business keys |
| Unique constraints on business keys | ✅ | `UNIQUE NOT NULL` on `po_number`, `order_number`, etc. |
| Foreign key relationships documented | ⚠️ | Check `firebase-bridge.js` for implicit relationships |
| `ON CONFLICT DO NOTHING` for idempotent inserts | ✅ | Used in all seed scripts |
| SSL disabled for local connections | ✅ | `ssl: false` in local Pool config |
| SSL required for Neon connections | ✅ | `ssl: { rejectUnauthorized: false }` in neonClient |

---

## 📊 Progress Tracker

| Phase | Status | Key Deliverable |
|---|---|---|
| 1. pgAdmin Navigation | ✅ Complete | Can open Query Tool, browse tables, run SELECT queries |
| 2. 5 Databases Overview | ✅ Complete | Understands each DB's purpose and table contents |
| 3. Manual Table Creation | 🔲 Next | Can CREATE TABLE, INSERT, UPDATE, DROP via pgAdmin GUI and SQL |
| 4. SQL Testing & Compatibility | 🔲 Next | Can write aggregations, JOINs, test constraints |
| 5. Inter-Module Communication | 🔲 Next | Can trace data flow across all 4 module DBs |
| 6. Script-Based Persistence | 🔲 Next | Can run seeders and write custom seed scripts |
| 7. UI ↔ Backend ↔ DB Sync | 🔲 Next | Can trace a request from React → Vercel → Postgres |
| 8. API Validation | 🔲 Next | Can test endpoints and validate end-to-end flows |

---

## 🎯 What You'll Be Able to Do After This Curriculum

1. **Navigate pgAdmin** like you navigate VS Code — open databases, browse tables, run queries, edit data
2. **Understand every database** in your project — why 5 exist, what each holds, how they relate
3. **Create and modify tables** manually in pgAdmin AND via SQL scripts
4. **Write and test SQL** — aggregations, JOINs, constraints, data integrity rules
5. **Trace inter-module communication** — follow data from procurement → inventory → analytics → dashboard
6. **Run and write seeders** — understand how data gets into the database, create custom seed scripts
7. **Trace the full stack** — from a button click in React → Vercel serverless → Postgres query → result back to UI
8. **Validate APIs** — test endpoints, verify end-to-end flows, debug issues
9. **Stay within Vercel limits** — understand the 12-function constraint and how to optimize
10. **Deliver a full-stack project** — with local dev environment, seeded databases, tested APIs, and a working UI

This transforms you from a **vibe coder** (who knows the tools work) to a **medium-technical developer** (who understands WHY each piece exists and HOW they connect).
