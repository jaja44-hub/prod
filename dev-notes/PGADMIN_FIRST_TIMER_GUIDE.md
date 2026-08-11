# pgAdmin 4 — First-Timer Navigation Guide

**For:** Addis Crown ERP developers learning pgAdmin as their first database GUI tool.
**Assumes:** You're familiar with VS Code (Explorer sidebar, editor panel, terminal, extensions).
**Goal:** Navigate pgAdmin confidently, create tables, enter data, run queries, validate results — all against your local Addis Crown databases.

---

## 1. Launching pgAdmin 4

### From Terminal
```bash
pgadmin4
```

### From Applications Menu
Search for **pgAdmin 4** in your Linux application launcher.

### First Launch
- You'll be prompted to set a **master password** (if you haven't already).
- This password encrypts saved server passwords in pgAdmin's local SQLite DB (`~/.pgadmin/pgadmin4.db`).
- **Important:** This password does NOT affect any database server — it only protects pgAdmin's own credential vault.
- You already reset yours earlier — use that password.

---

## 2. The pgAdmin Interface — VS Code Equivalents

Think of pgAdmin as a **database-focused IDE**. Here's how each part maps to VS Code concepts you already know:

### 2.1 Left Sidebar = VS Code Explorer

```
Servers                          ← Like your VS Code workspace root
  └── Local Addis Crown          ← Like a project folder
        └── Databases            ← Like src/ directory
              ├── addiscrown_local
              ├── addiscrown_accounting_local
              ├── addiscrown_procurement_local
              ├── addiscrown_analytics_local
              └── addiscrown_tenantfinance_local
        └── Login/Group Roles    ← Like .vscode/ settings
        └── Tablespaces          ← Like .gitignore rules
```

**How to navigate:**
- Click the **▶ arrow** next to any node to expand it (like expanding a folder in Explorer).
- Click a node to select it (like clicking a file in Explorer).
- Right-click any node for context menu actions (like right-clicking a file for "Open With", "Rename", "Delete").

### 2.2 Main Workspace = VS Code Editor

This is where you write SQL queries. It has:
- **Syntax highlighting** (keywords in color, like VS Code's language modes)
- **Line numbers** (like VS Code's gutter)
- **Auto-completion** (suggests table names and columns as you type — like VS Code's IntelliSense)
- **Error underlines** (red squiggly lines for syntax errors — like VS Code's Problems panel)

### 2.3 Bottom Panels = VS Code Terminal + Output + Problems

| pgAdmin Panel | VS Code Equivalent | What It Shows |
|---|---|---|
| **Data Output** | Terminal output | Query results in a grid |
| **Messages** | Terminal | Execution status, row counts, timing |
| **Notifications** | Notifications panel | pgAdmin system messages |
| **Error Logs** | Problems panel | pgAdmin and server errors |

### 2.4 Top Menu Bar = VS Code Menu Bar

| Menu | VS Code Equivalent | Key Actions |
|---|---|---|
| **File** | File | New Query Window, Import/Export |
| **Tools** | Terminal / Commands | Maintenance, Backup, Restore |
| **View** | View | Show/hide panels |
| **Help** | Help | Documentation |

---

## 3. Registering Your Local Server (One-Time Setup)

This is the equivalent of **opening a folder in VS Code** — you're telling pgAdmin where your database lives.

### Step-by-Step

1. In the left sidebar, right-click **Servers** → **Register** → **Server...**
2. **General tab:**
   - Name: `Local Addis Crown`
   - (Group can stay as "Servers")
3. **Connection tab:**
   - Host name/address: `127.0.0.1`
   - Port: `5432`
   - Maintenance database: `addiscrown_local`
   - Username: `ja`
   - Password: `localdev`
   - ✅ Check **"Save password?"**
4. Click **Save**.

### Verify It Worked
- Expand **Servers → Local Addis Crown → Databases** in the sidebar.
- You should see all 5 databases listed.
- Expand any database → **Schemas** → **public** → **Tables**.

---

## 4. The Query Tool — Your SQL Editor

### Opening the Query Tool
1. Right-click any database (e.g., `addiscrown_local`) → **Query Tool**.
2. A SQL editor opens in the main workspace.

### Running a Query
1. Type your SQL in the editor.
2. Click the **▶ Execute** button in the toolbar (or press `F5`).
3. Results appear in the **Data Output** tab at the bottom.
4. Messages (row count, execution time) appear in the **Messages** tab.

### Your First Query (Try It Now)
```sql
SELECT current_database() AS database,
       current_user    AS user,
       version()       AS postgres_version;
```
Click ▶ Execute. You should see a single row with your database name, user, and PostgreSQL version.

### Understanding the Result Grid
The Data Output tab shows results in a **spreadsheet-like grid**:
- Each row is a record.
- Each column is a field.
- You can **sort** by clicking column headers.
- You can **resize** columns by dragging their edges.
- You can **copy** a cell value by right-clicking → Copy.

This is like viewing JSON data in VS Code — but in a table format.

---

## 5. Browsing Table Data

### Viewing All Rows of a Table
1. Expand **Servers → Local Addis Crown → Databases → addiscrown_local → Schemas → public → Tables**.
2. Right-click any table (e.g., `suppliers`) → **View/Edit Data** → **All Rows**.
3. A spreadsheet grid opens showing all rows and columns.

### This Is Like Opening a File in VS Code
- **View/Edit Data → All Rows** = "open the file to see all contents"
- **View/Edit Data → Filtered Rows** = "open the file and search for specific content"

### Editing Data Directly in the Grid
1. In the data grid, **double-click** any cell.
2. Change the value.
3. Press `Enter` or click the **💾 Save** button (toolbar).
4. The change is committed to the database immediately.

**⚠️ Warning:** This is like editing a file directly — there's no "undo" in the traditional sense. Be careful with production data. For local dev, it's safe.

### Adding a New Row
1. In the data grid, click the **✚ Add Row** button (or the blank row at the bottom).
2. Fill in values for each column.
3. Click the **💾 Save** button.

### Deleting a Row
1. Select the row(s) by clicking the row selector (leftmost column).
2. Right-click → **Delete Row**.
3. Confirm the deletion.

---

## 6. Creating Tables via the GUI

### Using the GUI Table Creator
1. Expand **Servers → Local Addis Crown → Databases → addiscrown_local → Schemas → public → Tables**.
2. Right-click **Tables** → **Create** → **Table...**
3. **General tab:**
   - Name: `my_first_table`
4. **Columns tab:** Click **Add** for each column:
   - Column 1:
     - Name: `id`
     - Type: `integer`
     - ✅ Primary key
     - ✅ Not null
   - Column 2:
     - Name: `name`
     - Type: `text`
     - ✅ Not null
   - Column 3:
     - Name: `created_at`
     - Type: `timestamp without time zone`
     - Default value: `CURRENT_TIMESTAMP`
5. Click **Save**.

### The Table Now Appears in the Sidebar
- Expand **Tables** — you'll see `my_first_table` listed.
- This is like creating a new file in VS Code's Explorer — it's immediately visible in the project structure.

### Verifying the Table
1. Right-click `my_first_table` → **Query Tool**.
2. Type:
```sql
SELECT * FROM my_first_table;
```
3. Click ▶ Execute. The grid will be empty (no rows yet) — the table exists but has no data.

---

## 7. Creating Tables via SQL (Query Tool)

### Why Learn SQL Table Creation?
The GUI table creator is great for simple tables. But for complex tables with constraints, indexes, and foreign keys, SQL gives you full control — like writing code vs. using a drag-and-drop builder.

### Example: Create a Table with Constraints

Open the Query Tool for `addiscrown_local` and type:

```sql
CREATE TABLE IF NOT EXISTS test_products (
    id SERIAL PRIMARY KEY,
    sku VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL CHECK (price > 0),
    stock INTEGER DEFAULT 0 CHECK (stock >= 0),
    category VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

Click ▶ Execute. Check the **Messages** tab — you should see `CREATE TABLE`.

### Understanding the Constraints

| Constraint | What It Does | VS Code Equivalent |
|---|---|---|
| `PRIMARY KEY` | Uniquely identifies each row | Like a file's unique path |
| `UNIQUE` | No duplicate values in this column | Like a unique filename in a folder |
| `NOT NULL` | Column cannot be empty | Like a required field in a form |
| `CHECK (price > 0)` | Value must satisfy a condition | Like input validation in a form |
| `DEFAULT CURRENT_TIMESTAMP` | Auto-fills with current time if not provided | Like a default value in a config file |
| `FOREIGN KEY` | Links to another table's primary key | Like an import statement linking modules |

### Adding a Foreign Key (Linking Tables)

```sql
-- Add a category column that references a categories table
ALTER TABLE test_products
ADD COLUMN category_id INTEGER REFERENCES categories(id);
```

This creates a relationship — like an import in VS Code that links one file to another.

---

## 8. Inserting and Updating Data via SQL

### Inserting Rows

```sql
INSERT INTO test_products (sku, name, price, stock, category)
VALUES
    ('SKU-001', 'Test Product A', 29.99, 100, 'Electronics'),
    ('SKU-002', 'Test Product B', 49.99, 50,  'Books'),
    ('SKU-003', 'Test Product C', 9.99,  200, 'Accessories');
```

Click ▶ Execute. Check Messages for `INSERT 0 3` (3 rows inserted).

### Verifying the Insert

```sql
SELECT sku, name, price, stock FROM test_products;
```

You'll see a grid with your 3 products — like opening a JSON file to verify its contents.

### Updating Rows

```sql
UPDATE test_products
SET price = 34.99, stock = 150
WHERE sku = 'SKU-001';
```

Check Messages for `UPDATE 1` (1 row updated).

### Deleting Rows

```sql
DELETE FROM test_products WHERE sku = 'SKU-003';
```

Check Messages for `DELETE 1` (1 row deleted).

### Using ON CONFLICT (Upsert)

This is the same pattern used in your seed scripts — safe for re-running:

```sql
INSERT INTO test_products (sku, name, price, stock)
VALUES ('SKU-001', 'Test Product A', 34.99, 150)
ON CONFLICT (sku) DO NOTHING;
```

This means: "Insert this row, but if a row with the same `sku` already exists, do nothing instead of erroring."

---

## 9. Testing Computed Outputs

### Aggregation Queries (like VS Code's Find + Statistics)

```sql
-- Total value of all products in stock
SELECT SUM(price * stock) AS total_inventory_value FROM test_products;

-- Average price by category
SELECT category, AVG(price) AS avg_price, COUNT(*) AS product_count
FROM test_products
GROUP BY category;

-- Most expensive product
SELECT name, price FROM test_products ORDER BY price DESC LIMIT 1;
```

### JOINs (connecting related tables)

```sql
-- Show sales orders with customer details
SELECT
    so.order_number,
    so.total_amount,
    so.status,
    c.name AS customer_name,
    c.credit_limit
FROM sales_orders so
JOIN customers c ON so.customer_id = c.customer_code;
```

This is like VS Code's **multi-file search** — you're combining data from two "files" (tables) based on a matching key.

### Subqueries (queries inside queries)

```sql
-- Show customers whose total orders exceed the average order value
SELECT c.name, SUM(so.total_amount) AS total_spent
FROM customers c
JOIN sales_orders so ON c.customer_code = so.customer_id
GROUP BY c.name
HAVING SUM(so.total_amount) > (
    SELECT AVG(total_amount) FROM sales_orders
);
```

---

## 10. SQL Rule Compatibility & Syntax Checks

### PostgreSQL vs MySQL vs SQLite

Your project uses **PostgreSQL** everywhere (local + Neon). Here's what's PostgreSQL-specific:

| Feature | PostgreSQL | MySQL | SQLite |
|---|---|---|---|
| Auto-increment | `SERIAL` or `GENERATED ALWAYS AS IDENTITY` | `AUTO_INCREMENT` | `INTEGER PRIMARY KEY AUTOINCREMENT` |
| String concat | `||` operator | `CONCAT()` function | `||` operator |
| JSON type | `JSONB` (binary, indexed) | `JSON` (text) | `TEXT` (no native JSON) |
| Upsert | `ON CONFLICT DO NOTHING/UPDATE` | `ON DUPLICATE KEY UPDATE` | `ON CONFLICT DO NOTHING` |
| Boolean | `BOOLEAN` (true/false) | `TINYINT(1)` | `INTEGER` (0/1) |
| Array type | `INTEGER[]`, `TEXT[]` | No native arrays | No native arrays |
| Window functions | ✅ Full support | ✅ Full support | ✅ Full support (since 3.25) |

### Checking Syntax Before Running

pgAdmin has a **SQL formatter** and **syntax checker**:
1. In the Query Tool, right-click → **Format SQL** (or use the toolbar button).
2. This indents and formats your SQL for readability — like VS Code's Prettier formatter.
3. Red underlines in the editor show syntax errors before you execute.

### Common PostgreSQL Errors and Fixes

| Error Message | Cause | Fix |
|---|---|---|
| `column "x" does not exist` | Typo in column name | Check spelling, use double quotes for case-sensitive names |
| `relation "table_name" does not exist` | Table doesn't exist yet | Run CREATE TABLE first |
| `duplicate key value violates unique constraint` | Inserting a row with a duplicate primary key or unique column | Use `ON CONFLICT DO NOTHING` or check existing data first |
| `null value in column "x" violates not-null constraint` | Inserting NULL into a NOT NULL column | Provide a value for that column |
| `permission denied for table "x"` | User doesn't have access | Check that the `ja` role has proper permissions |

---

## 11. Exploring Your Addis Crown Databases

### Quick Tour: All 5 Databases

Open a Query Tool and run this to see all databases and their tables:

```sql
-- List all databases you have access to
SELECT datname FROM pg_database WHERE datistemplate = false ORDER BY datname;
```

Then for each database, connect to it and list tables:

```sql
-- In addiscrown_local
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- Count rows in each table
SELECT 'suppliers' AS tbl, count(*) FROM suppliers
UNION ALL SELECT 'purchase_orders', count(*) FROM purchase_orders
UNION ALL SELECT 'sales_orders', count(*) FROM sales_orders
UNION ALL SELECT 'chart_of_accounts', count(*) FROM chart_of_accounts
UNION ALL SELECT 'journal_entries', count(*) FROM journal_entries
UNION ALL SELECT 'customers', count(*) FROM customers
UNION ALL SELECT 'warehouse_receipts', count(*) FROM warehouse_receipts
UNION ALL SELECT 'products', count(*) FROM products
UNION ALL SELECT 'inventory_transactions', count(*) FROM inventory_transactions
UNION ALL SELECT 'crm_opportunities', count(*) FROM crm_opportunities;
```

### Understanding a Table's Structure

Right-click any table → **Properties** → **Columns** tab. You'll see:
- Column name
- Data type
- Whether it's nullable
- Default value
- Whether it's a primary key

This is like VS Code's **Outline view** — it shows the structure of a file at a glance.

### Viewing Table Indexes

Right-click a table → **Properties** → **Indexes** tab. Indexes speed up queries — like VS Code's search index that makes file search instant.

---

## 12. Practical Exercises

### Exercise 1: Create a Test Table
Create a table called `learning_log` with columns: `id`, `date`, `topic`, `notes`, `duration_minutes`. Insert 3 rows of learning notes. Query them back.

### Exercise 2: Test a JOIN
Join `sales_orders` with `customers` to show order numbers alongside customer names and credit limits.

### Exercise 3: Test an Aggregation
Calculate total revenue per customer from `journal_entries` where `entry_type = 'SALES_INVOICE'`.

### Exercise 4: Test a Constraint
Try inserting a negative price into `test_products`. Observe the error. Then add a `CHECK` constraint and verify it blocks negative values.

### Exercise 5: Test Cross-Module Query
Query `addiscrown_accounting_local` to show all vendor bills alongside their corresponding purchase orders (you'll need to use schema-qualified table names or dblink).

---

## 13. pgAdmin Shortcuts (Like VS Code Shortcuts)

| Action | pgAdmin Shortcut | VS Code Shortcut |
|---|---|---|
| Execute query | `F5` | `Ctrl+Enter` |
| Format SQL | Right-click → Format SQL | `Shift+Alt+F` |
| Save query | `Ctrl+S` | `Ctrl+S` |
| New query window | `Ctrl+N` | `Ctrl+N` |
| Auto-complete | `Ctrl+Space` | `Ctrl+Space` |
| Cancel running query | `Escape` | `Ctrl+C` |
| View results as JSON | Right-click result → Save as JSON | N/A |
| Export results to CSV | Right-click result → Export CSV | N/A |

---

## 14. pgAdmin AI Features

### AI Query Assistant
pgAdmin 4 v9+ includes an **AI Query Assistant** that can:
- Generate SQL from natural language descriptions
- Explain query execution plans in plain English
- Suggest optimizations for slow queries

**How to access:**
1. Look for the **AI** icon in the Query Tool toolbar.
2. Type a natural language request like: "Show me the top 5 customers by total spending."
3. The AI generates the SQL for you.
4. Review and execute the generated SQL.

**Note:** The AI runs on a cloud provider or local model — it does NOT automatically use your OpenRouter key. To connect it to your OpenRouter setup, you'd need to configure an AI backend in pgAdmin's preferences under **File → Preferences → AI**.

### AI-Powered Schema Exploration
pgAdmin can use AI to:
- Explain what each table in your database does
- Suggest relationships between tables
- Generate documentation for your schema

---

## 15. pgAdmin Developer Tools (Like VS Code DevTools)

### Query Execution Plan (EXPLAIN ANALYZE)
This is pgAdmin's equivalent of VS Code's **Debugger** — it shows exactly how Postgres executes your query:

```sql
EXPLAIN ANALYZE SELECT * FROM sales_orders WHERE total_amount > 1000000;
```

The output shows:
- Which indexes are used (or not)
- How many rows are scanned
- How long each step takes
- Where bottlenecks are

**This is how you optimize slow queries** — like using VS Code's profiler to find slow code.

### Schema Diff Tool
Compare two database schemas visually:
1. Right-click a database → **Schema Diff...**
2. Select two databases or schemas to compare.
3. pgAdmin shows differences in tables, columns, indexes, and constraints.

This is like VS Code's **Diff editor** (`Ctrl+Shift+M`) but for database schemas.

### Backup and Restore
1. Right-click a database → **Backup...**
2. Choose format (Plain SQL, Custom, Directory, Tar).
3. Save the backup file.
4. To restore: Right-click **Databases** → **Restore...** and select the backup file.

This is like VS Code's **File → Save As** and **File → Open** — but for entire databases.

---

## 16. Common pgAdmin Tasks Cheat Sheet

| Task | How to Do It |
|---|---|
| Connect to a database | Right-click database → **Connect** |
| Disconnect from a database | Right-click database → **Disconnect** |
| Open a query tool | Right-click database → **Query Tool** |
| View table data | Right-click table → **View/Edit Data** → **All Rows** |
| Create a new table | Right-click Tables → **Create** → **Table** |
| Drop a table | Right-click table → **Delete** (or `DROP TABLE`) |
| Run a query | Type SQL → Click ▶ or press `F5` |
| Save a query | `Ctrl+S` |
| Export query results | Right-click result grid → **Export CSV/JSON** |
| Check server status | Right-click server → **Properties** → **Connection** tab |
| View server logs | Right-click server → **View Logs** |
| Change server password | Right-click server → **Properties** → **Connection** tab |

---

## 17. Going Further

### Next Steps After This Guide
1. **Read the Apprenticeship Curriculum** (`dev-notes/APPRENTICESHIP_CURRICULUM.md`) for the full structured learning path.
2. **Practice the exercises** in Section 12 above.
3. **Explore the 5 local databases** — each has different tables and data representing different ERP modules.
4. **Connect pgAdmin to the module databases** (`addiscrown_accounting_local`, etc.) using the same registration steps.
5. **Write your own SQL queries** to explore relationships between tables across modules.
6. **Use the AI Query Assistant** to generate SQL from natural language — then review and understand the generated SQL.

### Key Files to Explore in VS Code
| File | What It Contains | Why It Matters |
|---|---|---|
| `seed-neon-local.mjs` | Creates + seeds the main 10 tables | Understand the base schema |
| `scripts/seed-local-modules.mjs` | Creates + seeds the 4 module databases | Understand module isolation |
| `api/firebase-bridge.js` | How Firebase ↔ Neon sync works | Understand cross-module communication |
| `server/api/lib/neonClient.js` | How the app connects to Postgres | Understand the connection pool pattern |
| `api/lib/shared.js` | Database routing logic | Understand which DB each module uses |
| `dev-notes/LOCAL_DB_WORKFLOW.md` | Local ↔ remote workflow guide | Understand dev vs. production workflow |
| `dev-notes/APPRENTICESHIP_CURRICULUM.md` | Full 8-phase curriculum | Structured learning path |
