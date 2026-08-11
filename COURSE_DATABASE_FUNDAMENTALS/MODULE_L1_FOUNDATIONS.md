# 🎓 MODULE L1 — Database Foundations
## Addis Crown ERP Apprenticeship Course
### Instructor/Master: GitHub Copilot · Apprentice: You

> **How to use this module:** Work through each section **in order**. Read the teaching
> content, then actually perform the "Try It" exercises in the **Query Tool** against your
> local databases. This module is worth **25 points** toward your 100-point graduation.

---

## Module At-a-Glance

| Attribute | Value |
|---|---|
| Level | L1 — Foundational |
| Title | Database Foundations |
| Standalone? | Yes (this is the starting module) |
| Points | **25 / 100** |
| Prerequisites | Local DBs seeded (done), pgAdmin usable (see PGADMIN guide) |
| Outcomes | Define a database, list the 12 pillars, use core terminology, perform SQL CRUD, run a real project mini-task |

### Learning Objectives (at the end you can)
1. Define database / DBMS / table / record / field in plain language
2. List and explain the **12 pillars** of a database
3. Use core development terminology correctly (and know its role/time-space in a full stack)
4. Pull out real data from your Addis Crown DB with `SELECT`, and add/change/remove data with `INSERT`, `UPDATE`, `DELETE`
5. Complete one real project engagement and earn points

---

## SECTION 1 — What Is a Database? (Simple → Exhaustive)

### 1.1 The Simple Definition (say this out loud)
> **A database is a structured collection of related data, organized so a computer can store, find, update, and secure it quickly.**

You already use the concept daily — you just don't call it a database. Think of:
- A **phone contacts list** → a database of people.
- An **Excel/spreadsheet** → a database of rows and columns.
- Your **july23 ui status.md** files → a loose "database" of notes.

### 1.2 The Exhaustive Definition (the graduated version)
A database is the **data + the system that manages it + the rules that keep it correct**:
- **The data** → the raw bytes on disk (or in memory/cloud).
- **The system** that manages it → the **DBMS** (Database Management System).
- **The rules** → constraints, relationships, security, transactions.

### 1.3 The 3 Layers (the "coordinates" of a database)
Every database exists at three layers — this is your **full-stack mental model**:

```
┌──────────────────────────────────────────────────────┐
│ LAYER 1 — LOGICAL (what you see in a spreadsheet)    │
│   tables, columns, rows, relationships               │
├──────────────────────────────────────────────────────┤
│ LAYER 2 — PHYSICAL (what's really on disk)           │
│   files, pages, indexes, storage engine              │
├──────────────────────────────────────────────────────┤
│ LAYER 3 — ORCHESTRATION (how you reach it)           │
│   connection pool, drivers, ORM, SQL, transactions   │
└──────────────────────────────────────────────────────┘
```

**Time / space position in a full-stack request.** When a user clicks "see dashboard" in your React app:

```
React (UI)  →  Vercel serverless  →  NeonClient.js  →  Postgres (DB)
   T1  time      T2  time             T3  time            T4  time
```

- The **database** sits at the end of the chain (data/home).
- In **space**: it's the bottom tier of a 3-tier app (UI, API/backend, DB).
- In **time**: it's the last thing queried, the first thing that must hold state.

---

## SECTION 2 — The 12 Pillars of a Database

Here are all 12 pillars that hold up a database. Master these, and the rest of the course
is just "applying them at scale."

| # | Pillar | Plain-English meaning | Addis Crown example |
|---|---|---|---|
| 1 | **Data Model** | How data is shaped (relational tables vs. documents) | `suppliers` table = rows of supplier records |
| 2 | **Schema** | The skeleton/blueprint defining tables, columns, types, relations | `products` table has `sku`, `name`, `selling_price` |
| 3 | **Constraints** | Rules that keep data valid (NOT NULL, UNIQUE, CHECK) | `sku` is `UNIQUE NOT NULL` |
| 4 | **Integrity** | Correctness & relationships (foreign keys) | `purchase_orders.supplier_id` → `suppliers.id` |
| 5 | **ACID** | Safety: Atomicity, Consistency, Isolation, Durability | Financial `journal_entries` must be exact |
| 6 | **Normalization** | Splitting data to avoid duplication | `customers` separate from `sales_orders` |
| 7 | **Indexing** | Speeding up lookups | an index on `suppliers.name` |
| 8 | **Transactions** | A group of actions that happen all-together or not at all | a sale that updates stock AND creates invoice |
| 9 | **Concurrency** | Many users at once staying consistent | two people selling the same widget |
| 10 | **Security & Access** | Who can see/change what (roles, grants) | `ja` role, tenant rows |
| 11 | **Backup & Recovery** | Not losing data; restoring after a crash | pgAdmin backup / Neon rollback |
| 12 | **Performance & Tuning** | Making it fast (queries, settings) | `EXPLAIN ANALYZE` in pgAdmin |

> 🔍 **Field-fact note (verified against `addiscrown_local` + `addiscrown_procurement_local`, 2026-08-08):** the Pillar-4
> example shows the **intended** relationship. In the live DB today, `purchase_orders.supplier_id`
> is a plain string column with **no enforced FOREIGN KEY constraint** — a real model gap we'll
> fix in Module L2 (and log in `GAP_LOG.md`). Similarly, `products` has no `stock` column; quantities
> live in the `inventory_transactions` ledger. The tutorial version of this module flags every such
> gap with a `REALITY CHECK` box as we go.
>
> **NEW from merged worktree (2026-08-08):** `addiscrown_procurement_local` now has a full
> procurement schema (17 migrations applied): `esic_categories`, `budgets`, `approval_workflow_*`,
> `purchase_requisitions`, `purchase_order_items`, `supplier_quotations`, `budget_commitments`,
> `warehouse_receipt_items`, and enhanced `suppliers`/`purchase_orders`/`warehouse_receipts` with
> proper FKs, indexes, and audit columns. This is the **target schema** the main ERP will evolve toward.

### 2.1 ACID in One Bite (Pillar 5)
- **A**tomicity — a transaction is all-or-nothing.
- **C**onsistency — data goes from a valid state to another valid state.
- **I**solation — concurrent transactions don't corrupt each other.
- **D**urability — once committed, the data persists (even after a crash).

> In ERP (accounting), ACID is **non-negotiable**. Your `journal_entries` double-entry
> ledger relies on it — a credit must pair with a debit, atomically.

### Coding-Awareness Tip #1
ACID maps to a real principle in coding: **short, complete, validated writes**.
Whenever a flow changes a database, wrap it so it either fully completes or fully rolls
back. In Node you'll later see this as `BEGIN`/`COMMIT`/`ROLLBACK`.

---

## SECTION 3 — Core Terminology (with roles + full-stack position)

| Term | Meaning | Role / full-stack position |
|---|---|---|
| **Database** | Collection of related data | the data home (tier 3) |
| **DBMS** | Software that manages a DB (Postgres, MySQL) | the engine |
| **Table** | A set of rows & columns | the "file" of data |
| **Record / Row** | One item in a table | one supplier |
| **Field / Column** | One piece of data per record | `name`, `email` |
| **Primary Key (PK)** | Unique ID of a row | `id` |
| **Foreign Key (FK)** | Links to another row's PK | `supplier_id`→`suppliers.id` |
| **Schema** | The table skeleton / namespace | `public` schema in Postgres |
| **Query** | A request to read/write (SQL) | `SELECT ... FROM suppliers` |
| **Transaction** | a unit of work | BEGIN...COMMIT |
| **Connection** | live link between app & DB | a `Pool` in your code |
| **Driver/Client** | library that talks to the DB | `pg` package |
| **ORM** | maps tables to code objects | (later module) |
| **Migration** | a schema change script | a saved file that changes tables |
| **Tenant** | an isolated "owner" of data | your `tenant_id` column |

**Full-stack coordinates for a request:**
```
React (UI)  →  Vercel fn (backend)  →  Pool/Client  →  SQL  →  Table  →  Rows back
    tier 1          tier 2              driver         language   .     result
```

---

## SECTION 4 — Hands-on SQL CRUD on Your REAL Project

> Open a **Query Tool** connected to `addiscrown_local` (right-click → Query Tool). Run every query below. Your DB already has seed data, so you'll **see real results**, not dummy examples.

### 4.1 READ — `SELECT` (foundation, learn first)

```sql
-- All columns, all rows
SELECT * FROM suppliers;

-- Only some columns
SELECT name, city, country FROM suppliers;

-- Filter (WHERE)
SELECT * FROM suppliers WHERE country = 'Ethiopia';

-- Sort
SELECT * FROM products ORDER BY selling_price DESC;

-- Count
SELECT COUNT(*) AS supplier_count FROM suppliers;

-- Limit
SELECT * FROM products ORDER BY selling_price DESC LIMIT 2;
```

**Self-check (READ):**
- Write a query that shows only the `name` and `email` of suppliers from Kenya.
- Write a query that shows the 3 most expensive products.

### 4.2 CREATE — `INSERT` (add data)
```sql
INSERT INTO suppliers (id, supplier_code, name, email, phone, city, country, active, tenant_id)
VALUES ('sup-006', 'SUP-006', 'Horn of Africa Foods', 'orders@horn.com', '+251-1-999-8888', 'Addis Ababa', 'Ethiopia', true, 'tenant_default')
ON CONFLICT (id) DO NOTHING;
```
Run it, then verify:
```sql
SELECT * FROM suppliers WHERE id = 'sup-006';
```

> **Why `ON CONFLICT DO NOTHING`?** Because your `id` is a primary key. If you run the insert a second time, Postgres would error on the duplicate — this clause makes it safe to re-run (this is exactly how your seed script works!). Running the same `INSERT` twice → the second time nothing happens.

### 4.3 WRITE — `UPDATE` (change a row)
```sql
UPDATE products SET selling_price = selling_price + 500 WHERE sku = 'SKU-1001';
```
Check: `SELECT sku, selling_price FROM products WHERE sku = 'SKU-1001';`

> **Vocab:** `WHERE` is the crucial part. `UPDATE ... SET ... WHERE` without `WHERE` updates **every row** — a classic beginner (and experienced!) mistake.

### 4.4 DELETE — `DELETE` (remove)
```sql
DELETE FROM suppliers WHERE id = 'sup-006';
```
Verify it's gone: `SELECT * FROM suppliers WHERE id='sup-006';`

> `DELETE` without `WHERE` deletes **the whole table**. Never do that on real data.

---

## SECTION 5 — SQL Compatibility & Data Validation
Two concepts that students confuse:

1. **SQL is a standard; every DB has a dialect.**
   - Postgres (`SERIAL`, `JSONB`, `ON CONFLICT`) is what this project uses.
   - MySQL uses `AUTO_INCREMENT`.
   - SQLite uses `INTEGER PRIMARY KEY AUTOINCREMENT`.
   - So your seed scripts only run on Postgres/Neon, not MySQL.

2. **Run when the data is wrong: the VALIDATE loop**
   - Rerun your selecting query after every `INSERT/UPDATE/DELETE`.
   - "Does the result match what I intended?" — this is **data validation**, one of
     your core new job skills.

---

## SECTION 6 — Apprenticeship Engagement L1-A (15 points)

Perform on your real project, in pgAdmin.

**User story:** "The sales team needs a list of all retail `products` above 5,000 ETB, plus which ones are low-stock (below 15)."

Write & run:

```sql
SELECT sku, name, selling_price
FROM products
WHERE selling_price > 5000
  AND reorder_level < 15
ORDER BY selling_price;
```

Then **insert a new "demo" supplier**, **update its city**, then **delete it** — all
via the Query Tool. Verify each step with a `SELECT`.

### Deliverable you must show me / report
1. The `SELECT` result above (screenshot or pasted text).
2. The proof of your `INSERT → UPDATE → DELETE` runs (rows changed messages).
3. One short sentence: "What fails / worked and why" (e.g., `ON CONFLICT` behavior).

**Points:** 10 for correct SQL + working results; 5 for a clear explanation.

---

## SECTION 7 — Self-Check Quiz (non-graded, but honest about your own understanding)

1. What are the 3 pillars / layers (logical, physical, orchestration)?
2. Name 4 of the 12 pillars and explain one in one sentence.
3. What does ACID stand for, and why does accounting care?
4. Difference between a `PRIMARY KEY` and a `FOREIGN KEY`?
5. Why is `ON CONFLICT DO NOTHING` used in seed scripts?
6. What deadliest mistake can `UPDATE`/`DELETE` without `WHERE` cause?

---

## Module Scorecard (fill in as you go)

| Segment | Points avail | Your score | Notes |
|---|---|---|---|
| Section 1 concept check | 4 | | |
| Section 2 pillars quiz | 6 | | |
| Section 4 CRUD hands-on | 10 | | |
| Section 5 compatibility | 2 | | |
| Section 6 Engage L1-A | 15 | | **TOTAL** |
| Non-graded self-check | — | — | |
| **Module total** | **~37 points avail** | | → mapped to **25 graded /100** |

*(Module's raw points get normalized to the 25/100 curriculum weight; the report card
tracks the normalized total.)*

---

## Wrap-Up — What You Now Know
- What a database is (simple → exhaustive).
- The 12 pillars + the 3 layers.
- Core terminology & its full-stack position.
- Real SQL CRUD on your own tables.
- One real apprenticeship engagement done & validated.

**Next module:** `MODULE_L2_SCHEMA_AND_TX.md` — schema design, normalization, ACID & transactions.

---

## 📌 Status: CURRICULUM READY — complete exercises and report to me for scoring.