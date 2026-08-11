# 🎓 TUTORIAL MODULE L1 — Database Foundations (Exhaustive Kindergarten-to-Professional Edition)
## Addis Crown ERP Apprenticeship Course
### Instructor/Master: GitHub Copilot · Apprentice: You

> **How to use this tutorial:** This is the **deep-dive companion** to `MODULE_L1_FOUNDATIONS.md`. Read this **first** (or alongside) to build an unshakeable mental model. Every concept is decomposed to atomic level, illustrated with kindergarten metaphors, visual diagrams, and step-by-step construction logic. Plan **60–90 minutes** for thorough study. By the end, you'll not just "know" the terms—you'll *see* how they assemble from single bricks into a living database system.

---

## 📚 MODULE AT-A-GLANCE (Tutorial Edition)

| Attribute | Value |
|---|---|
| **Level** | L1 — Foundational (Kindergarten → Medium-Technical) |
| **Title** | Database Foundations — Tutorial / Deep-Dive Edition |
| **Pair Document** | `MODULE_L1_FOUNDATIONS.md` (condensed reference + practice) |
| **Points** | **25 / 100** (same as standard module) |
| **Prerequisites** | Local DBs seeded, pgAdmin installed, curiosity |
| **Outcomes** | *Visualize* a database from atom to ecosystem; *explain* every term to a 5-year-old; *trace* any SQL command to its physical effect; *confidently* enter Module L2 |

### Learning Objectives (Tutorial-Enhanced)
1. **Deconstruct** "database" into: data + manager + rules → physical files → logical tables → orchestration layer
2. **Build** the 12 pillars from first principles: why each exists, what breaks without it, how they interlock
3. **Master** 25+ core terms with: kindergarten metaphor → technical definition → full-stack role → visual position
4. **Trace** CRUD operations from keystroke → parser → planner → executor → storage engine → disk → back
5. **Complete** Engagement L1-A with *understanding*, not just syntax memorization

---

# 🌱 PART 0 — THE SEED: HOW THIS TUTORIAL GROWS

## 0.1 The Pedagogical Tree Metaphor (Read This First)

```
                    🍎 FRUIT: Working ERP Module (Module L3+)
                       │
              ┌────────┴────────┐
              ▼                 ▼
        🌿 BRANCHES          🌿 BRANCHES
    Schema & TX (L2)    Integration (L3)
              │                 │
              └────────┬────────┘
                       ▼
              🌳 TRUNK: Core Competence
              (This Module L1)
                       │
         ┌─────────────┼─────────────┐
         ▼             ▼             ▼
    🌱 ROOT 1      🌱 ROOT 2      🌱 ROOT 3
  Concepts       Terminology    Hands-On SQL
  (Sec 1-2)      (Sec 3)        (Sec 4-6)
         │             │             │
         └─────────────┼─────────────┘
                       ▼
              🌰 THE SEED: CURIOSITY
              (You are here)
```

**How to read this tutorial:** Each section = one "growth stage." We start at the seed (atomic concepts), grow roots (decomposed definitions), build the trunk (integrated understanding), then sprout branches (practice). **Do not skip stages.** The kindergarten metaphors *are* the technical foundation—just translated.

## 0.2 Legend for All Diagrams in This Tutorial

| Symbol | Meaning | Used In |
|---|---|---|
| 🌰 | Atomic concept (indivisible) | Seed/Root sections |
| 🧱 | Building block (composable unit) | Pillars, Terminology |
| 🔗 | Connection / relationship | Foreign keys, Joins |
| ⚙️ | Process / mechanism | Transactions, Engine |
| 📦 | Container / structure | Tables, Schemas, Databases |
| 🎯 | Goal / outcome | Learning objectives |
| 🔍 | Inspection / validation | SELECT, EXPLAIN |
| 🛡️ | Protection / constraint | ACID, Constraints |
| 🌳 | Full system view | Architecture diagrams |
| 📝 | Your action / exercise | Practice sections |

---

# 🌱 PART 1 — ROOT 1: WHAT IS A DATABASE? (ATOMIC DECOMPOSITION)

## 1.1 The Kindergarten Definition: "A Magic Box That Remembers"

> **🌰 SEED CONCEPT:** A database is a **magic box** that:
> 1. **Accepts** things you give it (store)
> 2. **Remembers** them exactly (persist)
> 3. **Finds** them when you ask (retrieve)
> 4. **Changes** them when you say (update)
> 5. **Removes** them when you say (delete)
> 6. **Never lies** about what's inside (integrity)
> 7. **Handles many kids at once** (concurrency)
> 8. **Survives power outages** (durability)

```
┌─────────────────────────────────────────────┐
│           🎁 MAGIC BOX (DATABASE)           │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐     │
│  │  PUT IN │  │  KEEP   │  │ TAKE OUT│     │
│  │  (INSERT)│  │ (STORE) │  │ (SELECT)│     │
│  └────┬────┘  └────┬────┘  └────┬────┘     │
│       │            │            │          │
│       ▼            ▼            ▼          │
│  ┌─────────────────────────────────┐       │
│  │  📋 INVENTORY LIST (CATALOG)    │       │
│  │  Knows every item, where it is  │       │
│  └─────────────────────────────────┘       │
└─────────────────────────────────────────────┘
```

**Your daily magic boxes:**
- 📱 **Phone contacts** → Magic box for people (name → number)
- 📊 **Excel sheet** → Magic box for rows/columns (cell A1 = value)
- 🗂️ **File folder** → Magic box for papers (tab label → documents)
- 🧠 **Your memory** → Biological magic box (cue → recall)

## 1.2 The Exhaustive Definition: Three Inseparable Components

> **🧱 BUILDING BLOCK:** A database = **DATA** + **DBMS** + **RULES**  
> *None works without the others. Like a car = engine + wheels + steering.*

```
┌────────────────────────────────────────────────────────────────┐
│                    DATABASE = THREE LAYERS                     │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ LAYER 1: THE DATA (Raw Material)                       │   │
│  │  • Raw bytes on disk / memory / cloud                  │   │
│  │  • Organized as: files → pages → rows → columns        │   │
│  │  • Example: 0x48 0x65 0x6C 0x6C 0x6F = "Hello"        │   │
│  │  • Without Layer 2&3: just meaningless bits            │   │
│  └────────────────────────────────────────────────────────┘   │
│                              │                                 │
│                              ▼                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ LAYER 2: THE DBMS (The Manager)                        │   │
│  │  • Software: PostgreSQL, MySQL, SQLite, MongoDB...     │   │
│  │  • Jobs: parse SQL → plan → execute → return results   │   │
│  │  • Manages: memory, disk, cache, connections, locks    │   │
│  │  • Without Layer 1: nothing to manage                  │   │
│  │  • Without Layer 3: chaos (no rules)                   │   │
│  └────────────────────────────────────────────────────────┘   │
│                              │                                 │
│                              ▼                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ LAYER 3: THE RULES (The Constitution)                  │   │
│  │  • Constraints: NOT NULL, UNIQUE, CHECK, FK            │   │
│  │  • Relationships: 1:1, 1:N, M:N                        │   │
│  │  • Transactions: BEGIN/COMMIT/ROLLBACK                 │   │
│  │  • Security: GRANT/REVOKE, RLS, encryption             │   │
│  │  • Without Layer 1&2: rules with no world to govern    │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### 1.2.1 Deep-Dive: The Data Layer (Physical Reality)

```
🌰 ATOMIC: BIT (0 or 1)
    │
    ▼
🧱 BYTE (8 bits) = 1 character
    │
    ▼
🧱 FIELD/COLUMN VALUE (e.g., "Addis Ababa", 5000, true)
    │
    ▼
🧱 ROW/RECORD (tuple) = one complete fact: {id:1, name:"Horn Foods", city:"Addis"}
    │
    ▼
📦 PAGE (8KB in Postgres) = container for multiple rows
    │
    ▼
📦 FILE (segment) = collection of pages on disk
    │
    ▼
📦 TABLESPACE = logical grouping of files
    │
    ▼
🌳 DATABASE CLUSTER = all databases managed by one Postgres instance
```

**Key insight:** When you `SELECT * FROM suppliers`, the DBMS:
1. Finds the **table** in the **catalog** (system tables)
2. Locates its **files** on disk
3. Reads **pages** into **shared buffers** (RAM)
4. Extracts **rows** from pages
5. Projects **columns** you asked for
6. Returns **result set** over the **connection**

### 1.2.2 Deep-Dive: The DBMS Layer (The Manager at Work)

```
┌─────────────────────────────────────────────────────────────────┐
│                    POSTGRESQL ARCHITECTURE                       │
│                                                                  │
│  YOUR APP                                                        │
│     │                                                            │
│     ▼                                                            │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ CONNECTION POOLER (PgBouncer / built-in pool)           │    │
│  │ • Reuses connections • Limits max • Queues excess       │    │
│  └─────────────────────────────────────────────────────────┘    │
│     │                                                            │
│     ▼                                                            │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ POSTMASTER (main process)                               │    │
│  │ • Starts/stops • Forks backends • Manages shared memory │    │
│  └─────────────────────────────────────────────────────────┘    │
│     │                                                            │
│     ├──────────────────┬──────────────────┬──────────────────┐  │
│     ▼                  ▼                  ▼                  ▼  │
│  ┌─────────┐      ┌─────────┐      ┌─────────┐      ┌─────────┐ │
│  │BACKEND 1│      │BACKEND 2│      │BACKEND 3│      │BACKEND N│ │
│  │(your qry)│      │(other)  │      │(other)  │      │(other)  │ │
│  └────┬────┘      └────┬────┘      └────┬────┘      └────┬────┘ │
│       │                │                │                │      │
│       └────────────────┼────────────────┼────────────────┘      │
│                        ▼                ▼                       │
│              ┌─────────────────────────────────┐               │
│              │     SHARED MEMORY (RAM)         │               │
│              │  ┌───────────────────────────┐  │               │
│              │  │ SHARED BUFFERS (cache)    │  │  ← Hot pages  │
│              │  │  (default 128MB, tune!)   │  │               │
│              │  └───────────────────────────┘  │               │
│              │  ┌───────────────────────────┐  │               │
│              │  │ WAL BUFFERS (write-ahead) │  │  ← Durability │
│              │  └───────────────────────────┘  │               │
│              │  ┌───────────────────────────┐  │               │
│              │  │ LOCK TABLE (concurrency)  │  │  ← Isolation  │
│              │  └───────────────────────────┘  │               │
│              └─────────────────────────────────┘               │
│                        │                                       │
│                        ▼                                       │
│              ┌─────────────────────────────────┐               │
│              │         DISK (Persistent)       │               │
│              │  ┌─────────┐ ┌─────────┐       │               │
│              │  │DATA FILES│ │WAL FILES│       │               │
│              │  │(tables)  │ │(logs)   │       │               │
│              │  └─────────┘ └─────────┘       │               │
│              └─────────────────────────────────┘               │
└─────────────────────────────────────────────────────────────────┘
```

**Each backend process (your query) does:**
```
PARSE → REWRITE → PLAN → EXECUTE
  │        │        │        │
  ▼        ▼        ▼        ▼
SQL text  Rules   Cost    Scan/Join/
→ AST     (views,  model   Sort/Agg
          RLS)    (stats)  → tuples
```

### 1.2.3 Deep-Dive: The Rules Layer (The Constitution)

```
┌─────────────────────────────────────────────────────────────────┐
│                    THE RULES HIERARCHY                           │
│                                                                  │
│  🏛️ CONSTITUTION LEVEL (Database-wide)                          │
│  ├── Encoding, Locale, Collation                                │
│   ├── Timezone, Parameter defaults                              │
│   └── Roles, Grants, RLS policies                               │
│                                                                  │
│  🏛️ SCHEMA LEVEL (Namespace)                                    │
│  ├── CREATE SCHEMA public/tenant_xyz                            │
│   ├── Search path resolution                                    │
│   └── Schema-level privileges                                   │
│                                                                  │
│  🏛️ TABLE LEVEL (Structure)                                     │
│  ├── Columns: name, type, default, NOT NULL                     │
│   ├── Constraints: PK, UNIQUE, CHECK, FK, EXCLUSION             │
│   ├── Indexes: B-tree, Hash, GiST, GIN, BRIN                    │
│   ├── Triggers: BEFORE/AFTER INSERT/UPDATE/DELETE               │
│   └── Partitioning: RANGE, LIST, HASH                           │
│                                                                  │
│  🏛️ ROW LEVEL (Data)                                            │
│  ├── CHECK constraints evaluated per row                        │
│   ├── FK references validated per row                           │
│   ├── RLS policies filter per row                               │
│   └── Triggers fire per row                                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 1.3 The Three Layers (Coordinates) — Visual Deep-Dive

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    FULL-STACK COORDINATES OF A DATABASE                      │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ LAYER 1 — LOGICAL (What Humans See)                                 │    │
│  │                                                                     │    │
│  │   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                │    │
│  │   │   TABLE     │  │   TABLE     │  │   TABLE     │  ← Relations   │    │
│  │   │  suppliers  │──│ purchase_   │──│  products   │    (FK)        │    │
│  │   │             │  │  orders     │  │             │                │    │
│  │   └─────────────┘  └─────────────┘  └─────────────┘                │    │
│  │        │                │                │                          │    │
│  │        ▼                ▼                ▼                          │    │
│  │   ┌─────────────────────────────────────────────────┐               │    │
│  │   │           COLUMNS (Fields)                      │               │    │
│  │   │  id | supplier_code | name | email | city ...  │               │    │
│  │   └─────────────────────────────────────────────────┘               │    │
│  │        │                                                        │    │
│  │        ▼                                                        │    │
│  │   ┌─────────────────────────────────────────────────┐               │    │
│  │   │           ROWS (Records/Tuples)                 │               │    │
│  │   │  1 | SUP-001 | Horn Foods | x@y.com | Addis... │               │    │
│  │   │  2 | SUP-002 | Rift Valley | a@b.com | Hawassa│               │    │
│  │   └─────────────────────────────────────────────────┘               │    │
│  │                                                                     │    │
│  │   🎯 THIS IS YOUR MENTAL MODEL — DRAW IT, LIVE IN IT              │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ LAYER 2 — PHYSICAL (What Disk Sees)                                 │    │
│  │                                                                     │    │
│  │   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                │    │
│  │   │  FILE:      │  │  FILE:      │  │  FILE:      │                │    │
│  │   │ suppliers   │  │ purchase_   │  │ products    │                │    │
│  │   │ .12345      │  │ orders.67890│  │ .abcde      │                │    │
│  │   └──────┬──────┘  └──────┬──────┘  └──────┬──────┘                │    │
│  │          │                │                │                          │    │
│  │          ▼                ▼                ▼                          │    │
│  │   ┌─────────────────────────────────────────────────┐               │    │
│  │   │              PAGES (8KB each)                   │               │    │
│  │   │  Page 0: [Header][Row1][Row2][Free Space]      │               │    │
│  │   │  Page 1: [Header][Row3][Row4][Free Space]      │               │    │
│  │   │  ...                                            │               │    │
│  │   └─────────────────────────────────────────────────┘               │    │
│  │          │                                                        │    │
│  │          ▼                                                        │    │
│  │   ┌─────────────────────────────────────────────────┐               │    │
│  │   │              INDEXES (B-Tree)                   │               │    │
│  │   │  suppliers_pkey:  id → (file, page, offset)    │               │    │
│  │   │  suppliers_name_idx: name → (file, page, off)  │               │    │
│  │   └─────────────────────────────────────────────────┘               │    │
│  │                                                                     │    │
│  │   ⚙️ THIS IS WHAT THE DBMS MANAGES — YOU RARELY TOUCH IT           │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ LAYER 3 — ORCHESTRATION (How Code Reaches It)                       │    │
│  │                                                                     │    │
│  │   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                │    │
│  │   │  YOUR CODE  │  │  DRIVER     │  │  CONNECTION │                │    │
│  │   │  (Node/JS)  │──│  (pg lib)   │──│  POOL       │                │    │
│  │   └─────────────┘  └─────────────┘  └──────┬──────┘                │    │
│  │                                             │                        │    │
│  │                                             ▼                        │    │
│  │   ┌─────────────────────────────────────────────────┐               │    │
│  │   │              PROTOCOL (PostgreSQL wire)         │               │    │
│  │   │  Startup → Authentication → Query → Result      │               │    │
│  │   └─────────────────────────────────────────────────┘               │    │
│  │                                             │                        │    │
│  │                                             ▼                        │    │
│  │   ┌─────────────────────────────────────────────────┐               │    │
│  │   │              BACKEND PROCESS                    │               │    │
│  │   │  Parse → Plan → Execute → Return                │               │    │
│  │   └─────────────────────────────────────────────────┘               │    │
│  │                                                                     │    │
│  │   🔗 THIS IS YOUR CODE'S BRIDGE — YOU CONTROL IT                   │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.3.1 Time-Space Position in a Real Request

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    REQUEST FLOW: USER CLICKS "DASHBOARD"                     │
│                                                                              │
│  TIME ──────────────────────────────────────────────────────────────────►   │
│                                                                              │
│  T1  React (Browser)          │  User clicks "Sales Dashboard"             │
│       │                       │  Event handler fires                       │
│       ▼                       │                                            │
│  T2  fetch('/api/sales')      │  HTTP request to Vercel                    │
│       │                       │  Edge → Function cold/warm start           │
│       ▼                       │                                            │
│  T3  Vercel Function          │  Node.js runtime starts                    │
│       │  import { query }     │  Pool.connect() → get client               │
│       │  from '@/lib/neon'    │                                            │
│       ▼                       │                                            │
│  T4  neonClient.query()       │  Build SQL string                          │
│       │  "SELECT ..."         │  Send via pg wire protocol                 │
│       ▼                       │                                            │
│  T5  Network (TCP)            │  Packets travel (local: ~0.5ms, Neon: ~50ms)│
│       │                       │                                            │
│       ▼                       │                                            │
│  T6  Postgres Backend         │  Parse → Plan → Execute                    │
│       │  Shared Buffers hit?  │  Seq Scan vs Index Scan                    │
│       │  Disk read needed?    │  Rows → tuples → result set                │
│       ▼                       │                                            │
│  T7  Result Set Return        │  Tuples → wire protocol → TCP → Node       │
│       │                       │                                            │
│       ▼                       │                                            │
│  T8  Node receives            │  Parse rows → JSON → return Response       │
│       │                       │                                            │
│       ▼                       │                                            │
│  T9  React receives JSON      │  setState → re-render → paint              │
│       │                       │                                            │
│       ▼                       │                                            │
│  T10 User sees dashboard      │  🎉 Data traveled full circle              │
│                                                                              │
│  SPACE:  Browser → Edge → Function → Network → DB → Network → Function →   │
│          Edge → Browser  (7 network hops minimum!)                         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# 🌱 PART 2 — ROOT 2: THE 12 PILLARS (BUILDING BLOCKS FROM FIRST PRINCIPLES)

## 2.0 Why 12 Pillars? The "House" Metaphor

```
┌─────────────────────────────────────────────────────────────────┐
│                    A DATABASE IS A HOUSE                         │
│                                                                  │
│  🏠 PILLAR 1: DATA MODEL      →  Blueprint style (ranch vs apt) │
│  🏠 PILLAR 2: SCHEMA          →  Room layout, wall positions   │
│  🏠 PILLAR 3: CONSTRAINTS     →  Building codes (load-bearing) │
│  🏠 PILLAR 4: INTEGRITY       →  Plumbing/electrical connected │
│  🏠 PILLAR 5: ACID            →  Foundation (survives quakes)  │
│  🏠 PILLAR 6: NORMALIZATION   →  No duplicate rooms            │
│  🏠 PILLAR 7: INDEXING        →  Address numbers on doors      │
│  🏠 PILLAR 8: TRANSACTIONS    →  Atomic renovation (all/none)  │
│  🏠 PILLAR 9: CONCURRENCY     →  Multiple workers, no collisions│
│  🏠 PILLAR 10: SECURITY       →  Locks, keys, permissions      │
│  🏠 PILLAR 11: BACKUP         →  Blueprints stored off-site    │
│  🏠 PILLAR 12: PERFORMANCE    →  Insulation, efficient layout  │
│                                                                  │
│  REMOVE ONE → HOUSE HAS A FLAW                                   │
│  REMOVE SEVERAL → HOUSE COLLAPSES                                │
└─────────────────────────────────────────────────────────────────┘
```

## 2.1 Pillar-by-Pillar Atomic Decomposition

### PILLAR 1: DATA MODEL — "How We Shape Reality"

```
┌─────────────────────────────────────────────────────────────────┐
│  🌰 ATOMIC QUESTION: "How do we represent a fact?"              │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ RELATIONAL (Tables) — This Course / Addis Crown         │    │
│  │ • Facts = rows in tables                                │    │
│  │ • Relationships = foreign keys                          │    │
│  │ • Schema fixed at write time                            │    │
│  │ • ACID native                                           │    │
│  │ • SQL standard                                          │    │
│  │ • Best for: ERP, finance, inventory, orders             │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ DOCUMENT (JSON) — MongoDB, Postgres JSONB               │    │
│  │ • Facts = nested documents                              │    │
│  │ • Relationships = embedding or references               │    │
│  │ • Schema flexible (schema-on-read)                      │    │
│  │ • Eventual consistency common                           │    │
│  │ • Best for: catalogs, logs, user profiles               │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ KEY-VALUE — Redis, DynamoDB                             │    │
│  │ • Fact = key → blob                                     │    │
│  │ • No query language (get/put only)                      │    │
│  │ • Extreme speed, limited query                          │    │
│  │ • Best for: cache, sessions, flags                      │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ GRAPH — Neo4j, Postgres + Apache AGE                    │    │
│  │ • Facts = nodes + edges                                 │    │
│  │ • Relationships = first-class citizens                  │    │
│  │ • Traversal = primary query                             │    │
│  │ • Best for: social, fraud, recommendations              │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  🎯 ADDIS CROWN CHOICE: RELATIONAL (PostgreSQL)                │
│  Why? ERP = money + inventory + relationships = ACID + SQL     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### PILLAR 2: SCHEMA — "The Blueprint Before the Bricks"

```
┌─────────────────────────────────────────────────────────────────┐
│  🌰 ATOMIC: A schema is a **named collection of definitions**   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ WHAT A SCHEMA CONTAINS (PostgreSQL)                     │    │
│  │                                                         │    │
│  │  📦 TABLES          →  CREATE TABLE suppliers (...)    │    │
│  │  📦 VIEWS           →  CREATE VIEW active_suppliers... │    │
│  │  📦 INDEXES         →  CREATE INDEX ON suppliers(name) │    │
│  │  📦 SEQUENCES       →  CREATE SEQUENCE supplier_id_seq │    │
│  │  📦 FUNCTIONS       →  CREATE FUNCTION calc_tax(...)   │    │
│  │  📦 TYPES           →  CREATE TYPE currency AS ENUM... │    │
│  │  📦 TRIGGERS        →  CREATE TRIGGER ...              │    │
│  │  📦 FOREIGN TABLES  →  CREATE FOREIGN TABLE ...        │    │
│  │                                                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ NAMESPACE ISOLATION                                     │    │
│  │                                                         │    │
│  │  Database: addiscrown_local                             │    │
│  │    ├── Schema: public        (default, shared)         │    │
│  │    ├── Schema: tenant_001    (isolated data)           │    │
│  │    ├── Schema: tenant_002    (isolated data)           │    │
│  │    └── Schema: analytics     (reporting tables)        │    │
│  │                                                         │    │
│  │  Same table name in different schemas = different tables│    │
│  │  Search path: SET search_path TO tenant_001, public;   │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ SCHEMA EVOLUTION = MIGRATIONS                           │    │
│  │                                                         │    │
│  │  v1: CREATE TABLE suppliers (id, name);                │    │
│  │  v2: ALTER TABLE suppliers ADD COLUMN email;           │    │
│  │  v3: ALTER TABLE suppliers ADD CONSTRAINT email_chk    │    │
│  │       CHECK (email LIKE '%@%');                        │    │
│  │  v4: CREATE INDEX ON suppliers(email);                 │    │
│  │                                                         │    │
│  │  Each step = a migration file (version controlled)     │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  🎯 YOUR ADDIS CROWN SCHEMA: public schema, 10+ tables         │
│  In pgAdmin, expand: Databases → addiscrown_local → Schemas →  │
│  public → Tables  (the object tree shows everything)          │
│  Or in the Query Tool, run:                                    │
│    SELECT schemaname, tablename FROM pg_tables                │
│      WHERE schemaname = 'public' ORDER BY tablename;          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### PILLAR 3: CONSTRAINTS — "The Rules That Keep Data Honest"

```
┌─────────────────────────────────────────────────────────────────┐
│  🌰 ATOMIC: A constraint is a **rule the DBMS enforces**        │
│  automatically on every write. No application code needed.      │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ COLUMN-LEVEL CONSTRAINTS (attached to one column)       │    │
│  │                                                         │    │
│  │  NOT NULL        →  "This column must have a value"    │    │
│  │                    INSERT INTO t(c) VALUES (NULL);     │    │
│  │                    → ERROR: null value in column "c"   │    │
│  │                                                         │    │
│  │  UNIQUE          →  "No two rows can have same value"  │    │
│  │                    INSERT INTO t(c) VALUES (1);        │    │
│  │                    INSERT INTO t(c) VALUES (1);        │    │
│  │                    → ERROR: duplicate key value        │    │
│  │                                                         │    │
│  │  PRIMARY KEY     →  NOT NULL + UNIQUE + "main ID"      │    │
│  │                    Only ONE per table                  │    │
│  │                    Creates automatic index             │    │
│  │                                                         │    │
│  │  CHECK (expr)    →  "Value must satisfy condition"     │    │
│  │                    CHECK (price > 0)                   │    │
│  │                    CHECK (status IN ('active','inactive'))│
│  │                                                         │    │
│  │  DEFAULT         →  "Value if not provided"            │    │
│  │                    DEFAULT CURRENT_TIMESTAMP           │    │
│  │                    DEFAULT gen_random_uuid()           │    │
│  │                                                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ TABLE-LEVEL CONSTRAINTS (span multiple columns)         │    │
│  │                                                         │    │
│  │  PRIMARY KEY (a, b)     →  Composite key               │    │
│  │  UNIQUE (a, b)          →  Composite uniqueness        │    │
│  │  CHECK (a > b)          →  Cross-column rule           │    │
│  │  EXCLUSION USING ...    →  Advanced (no overlapping)   │    │
│  │                                                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ REFERENTIAL CONSTRAINTS (Foreign Keys) — PILLAR 4       │    │
│  │                                                         │    │
│  │  FOREIGN KEY (supplier_id) REFERENCES suppliers(id)    │    │
│  │                                                         │    │
│  │  ON DELETE CASCADE    →  Delete children when parent   │    │
│  │                         goes away                      │    │
│  │  ON DELETE RESTRICT   →  Prevent parent delete if      │    │
│  │                         children exist (DEFAULT)       │    │
│  │  ON DELETE SET NULL   →  Orphan children, nullify FK   │    │
│  │  ON UPDATE CASCADE    →  Propagate PK changes          │    │
│  │                                                         │    │
│  │  ⚠️ IMPORTANT (corrects a common myth):                │    │
│  │  PostgreSQL does NOT auto-create an index on the child │    │
│  │  (FK) column. The PARENT column's PK/unique index      │    │
│  │  guarantees the relationship; the CHILD column only    │    │
│  │  gets an index if YOU create one. Rule: add a manual   │    │
│  │  index on any FK column you filter/join on often.      │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  🎯 REALITY CHECK on YOUR addiscrown_local (POSTGRES says):    │
│  suppliers_pkey      (id)                                        │
│  products_pkey       (id),  products_sku_key  (sku)            │
│  purchase_orders_pkey(id), po_number unique                     │
│  NOTE: purchase_orders.supplier_id is currently a PLAIN string │
│  column with NO foreign key constraint in the DB — a real model │
│  gap you will log in GAP_LOG (see next section). It should be  │
│  FOREIGN KEY (supplier_id) REFERENCES suppliers(id).           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### PILLAR 4: INTEGRITY — "Everything Connected Correctly"

```
┌─────────────────────────────────────────────────────────────────┐
│  🌰 ATOMIC: Integrity = **data matches reality**                │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ ENTITY INTEGRITY                                        │    │
│  │ • Every row uniquely identifiable (PK)                  │    │
│  │ • No duplicate PKs, no NULL PKs                         │    │
│  │ • Enforced by PRIMARY KEY constraint                    │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ REFERENTIAL INTEGRITY                                   │    │
│  │ • Every FK value exists in referenced table's PK        │    │
│  │ • Or FK is NULL (if allowed)                            │    │
│  │ • Enforced by FOREIGN KEY constraint                    │    │
│  │ • Prevents "orphan" records                             │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ DOMAIN INTEGRITY                                        │    │
│  │ • Every column value matches its declared type/domain   │    │
│  │ • Enforced by: type system, CHECK, ENUM, DOMAIN         │    │
│  │ • Example: email column only accepts valid emails       │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ USER-DEFINED INTEGRITY (Business Rules)                 │    │
│  │ • Rules specific to your application                    │    │
│  │ • Implemented via: CHECK, TRIGGERS, APPLICATION CODE    │    │
│  │ • Example: "Invoice total = sum of line items"          │    │
│  │ • Example: "Credit limit not exceeded"                  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ INTENDED (IDEAL) INTEGRITY MODEL in Addis Crown        │    │
│  │ — the design you WANT the schema to enforce:           │    │
│  │                                                         │    │
│  │  suppliers (PK: id)                                     │    │
│  │       │                                                 │    │
│  │       │ 1:N                                             │    │
│  │       ▼                                                 │    │
│  │  purchase_orders (FK: supplier_id → suppliers.id)      │    │
│  │       │                                                 │    │
│  │       │ 1:N                                             │    │
│  │       ▼                                                 │    │
│  │  warehouse_receipts (FK: po_id → purchase_orders.id)   │    │
│  │                                                         │    │
│  │  🚩 CURRENT REALITY (checked 2026-08-08):              │    │
│  │  addiscrown_local has NO enforced foreign keys yet —   │    │
│  │  supplier_id is just a string column. The DB therefore  │    │
│  │  CANNOT stop an "orphan" order. This is a genuine,      │    │
│  │  valuable gap: enforcing FKs = a future fix to log in  │    │
│  │  GAP_LOG (planned deeper coverage in Module L2).      │    │
│  │                                                         │    │
│  │  IF the FK existed, then:                               │    │
│  │  DELETE FROM suppliers WHERE id='SUP-001';             │    │
│  │  → ERROR (RESTRICT) or CASCADE deletes children        │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### PILLAR 5: ACID — "The Unbreakable Foundation"

```
┌─────────────────────────────────────────────────────────────────┐
│  🌰 ATOMIC: ACID = 4 properties that make transactions SAFE     │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ A — ATOMICITY: All or Nothing                           │    │
│  │                                                         │    │
│  │  BEGIN;                                                 │    │
│  │    UPDATE accounts SET balance = balance - 100 WHERE id=1;│
│  │    UPDATE accounts SET balance = balance + 100 WHERE id=2;│
│  │  COMMIT;                                                │    │
│  │                                                         │    │
│  │  If CRASH after first UPDATE → both rolled back         │    │
│  │  If power loss → WAL replay ensures consistency         │    │
│  │                                                         │    │
│  │  🔧 IMPLEMENTATION: Write-Ahead Log (WAL)               │    │
│  │  Every change logged BEFORE applied to data files       │    │
│  │  Crash recovery: replay WAL → redo committed, undo      │    │
│  │  uncommitted                                            │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ C — CONSISTENCY: Valid State → Valid State              │    │
│  │                                                         │    │
│  │  Database constraints NEVER violated                    │    │
│  │  If transaction would break FK/CHECK → aborted          │    │
│  │  Application logic also responsible (triggers, checks)  │    │
│  │                                                         │    │
│  │  🔧 IMPLEMENTATION: Constraint checking at commit       │    │
│  │  Deferred constraints checked at COMMIT time            │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ I — ISOLATION: Concurrent = Serial                      │    │
│  │                                                         │    │
│  │  Four levels (weakest → strongest):                     │    │
│  │                                                         │    │
│  │  READ UNCOMMITTED  →  Dirty reads allowed (Postgres     │    │
│  │                       doesn't support this)             │    │
│  │  READ COMMITTED    →  Only see committed data (DEFAULT) │    │
│  │  REPEATABLE READ   →  Snapshot at transaction start     │    │
│  │  SERIALIZABLE      →  Fully serial execution            │    │
│  │                                                         │    │
│  │  🔧 IMPLEMENTATION: MVCC (Multi-Version Concurrency     │    │
│  │  Control) — each transaction sees a snapshot            │    │
│  │  Writers don't block readers, readers don't block       │    │
│  │  writers                                                │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ D — DURABILITY: Committed = Permanent                   │    │
│  │                                                         │    │
│  │  Once COMMIT returns, data survives:                    │    │
│  │  • Power loss                                           │    │
│  │  • OS crash                                             │    │
│  │  • Disk failure (if replicated)                         │    │
│  │                                                         │    │
│  │  🔧 IMPLEMENTATION: WAL + fsync                         │    │
│  │  synchronous_commit = on (default) = wait for disk      │    │
│  │  synchronous_commit = off = faster, risk of loss        │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ ACID IN YOUR ADDIS CROWN ERP                            │    │
│  │                                                         │    │
│  │  journal_entries (double-entry bookkeeping):            │    │
│  │  • Every entry: debit + credit = 0 (CONSISTENCY)        │    │
│  │  • Both lines written atomically (ATOMICITY)            │    │
│  │  • Concurrent posts don't corrupt (ISOLATION)           │    │
│  │  • Posted entries never lost (DURABILITY)               │    │
│  │                                                         │    │
│  │  💡 TRY IN pgAdmin:                                     │    │
│  │  BEGIN;                                                 │    │
│  │    INSERT INTO journal_entries ...;                     │    │
│  │    INSERT INTO journal_entries ...;                     │    │
│  │  COMMIT;  -- both succeed or both vanish                │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### PILLAR 6: NORMALIZATION — "No Duplicate Rooms"

```
┌─────────────────────────────────────────────────────────────────┐
│  🌰 ATOMIC: Normalization = **split tables to remove redundancy**│
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ THE PROBLEM: UNNORMALIZED TABLE                         │    │
│  │                                                         │    │
│  │  purchase_orders_bad:                                   │    │
│  │  ┌────┬──────────┬──────────┬────────┬────────┬───────┐ │    │
│  │  │ id│supplier  │sup_email │ product│ qty    │price  │ │    │
│  │  ├────┼──────────┼──────────┼────────┼────────┼───────┤ │    │
│  │  │ 1 │Horn Foods│h@h.com   │Wheat   │ 100    │ 5000  │ │    │
│  │  │ 2 │Horn Foods│h@h.com   │Teff    │ 50     │ 8000  │ │    │
│  │  │ 3 │Rift Valley│r@r.com  │Wheat   │ 200    │ 5000  │ │    │
│  │  └────┴──────────┴──────────┴────────┴────────┴───────┘ │    │
│  │                                                         │    │
│  │  PROBLEMS:                                              │    │
│  │  • Supplier email repeated (update anomaly)             │    │
│  │  • Can't add supplier without order (insert anomaly)    │    │
│  │  • Delete last order → lose supplier info (delete anomaly)│
│  │  • Wasted storage                                       │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 1NF: ATOMIC VALUES (no repeating groups)                │    │
│  │  • Each cell = single value                             │    │
│  │  • Already satisfied in relational model                │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 2NF: NO PARTIAL DEPENDENCIES (on composite PK)          │    │
│  │  • If PK = (a,b), no column depends on just a or just b │    │
│  │  • Move to separate table                               │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 3NF: NO TRANSITIVE DEPENDENCIES                         │    │
│  │  • If A→B and B→C, then A→C (transitive)                │    │
│  │  • Move C to its own table                              │    │
│  │                                                         │    │
│  │  suppliers:  id → name, email, city                     │    │
│  │  products:   id → name, sku, price, supplier_id (FK)    │    │
│  │  purchase_orders: id → supplier_id, date, total         │    │
│  │  po_lines:     id → po_id, product_id, qty, price       │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ BCNF: EVERY DETERMINANT IS A CANDIDATE KEY              │    │
│  │  • Stricter 3NF                                         │    │
│  │  • Rarely needed in practice                            │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ VISUAL: A FULLY NORMALIZED (IDEAL) ADDIS CROWN MODEL    │    │
│  │  ⚠️ IDEAL TARGET — NOT your current DB!                 │    │
│  │  (today: purchase_orders.items is JSONB, line items     │    │
│  │   live inside the order — there is NO po_lines table,   │    │
│  │   and products has NO supplier_id column. This shows   │    │
│  │   the textbook 3NF shape Module L2 will evolve toward.)  │    │
│  └─────────────────────────────────────────────────────────┘    │
│  │  ┌─────────────┐     ┌─────────────┐     ┌───────────┐  │    │
│  │  │  suppliers  │     │  products   │     │    po     │  │    │
│  │  │─────────────│     │─────────────│     │───────────│  │    │
│  │  │ PK: id      │     │ PK: id      │     │ PK: id    │  │    │
│  │  │ name        │     │ sku         │     │ supplier_ │  │    │
│  │  │ email       │     │ name        │     │   id (FK) │  │    │
│  │  │ city        │     │ price       │     │ date      │  │    │
│  │  │ country     │     │ supplier_id │     │ total     │  │    │
│  │  └──────┬──────┘     │    (FK)     │     └─────┬─────┘  │    │
│  │         │            └──────┬──────┘           │        │    │
│  │         │                   │                  │        │    │
│  │         │            ┌──────┴──────┐           │        │    │
│  │         │            │  po_lines   │           │        │    │
│  │         │            │─────────────│           │        │    │
│  │         │            │ PK: id      │           │        │    │
│  │         │            │ po_id (FK)  │◄──────────┘        │    │
│  │         │            │ product_id  │◄───────────────────┘    │    │
│  │         │            │ qty, price  │                      │    │
│  │         │            └─────────────┘                      │    │
│  │         │                                                 │    │
│  │         └─────────────────────────────────────────────────┘    │
│  │                                                         │    │
│  │  ✅ No supplier email repeated                          │    │
│  │  ✅ Can add supplier without order                      │    │
│  │  ✅ Delete order → supplier stays                       │    │
│  │  ✅ JOIN reconstructs full picture                      │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### PILLAR 7: INDEXING — "Address Numbers on Doors"

```
┌─────────────────────────────────────────────────────────────────┐
│  🌰 ATOMIC: Index = **auxiliary structure for fast lookup**     │
│  Trade-off: faster reads, slower writes, more storage           │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ WITHOUT INDEX (Sequential Scan)                         │    │
│  │                                                         │    │
│  │  SELECT * FROM suppliers WHERE name = 'Horn Foods';    │    │
│  │                                                         │    │
│  │  Postgres:                                              │    │
│  │  1. Read page 0 → check each row                        │    │
│  │  2. Read page 1 → check each row                        │    │
│  │  3. ... until end of table                              │    │
│  │  4. Return matching rows                                │    │
│  │                                                         │    │
│  │  Cost: O(N) — proportional to table size                │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ WITH B-TREE INDEX (Default)                             │    │
│  │                                                         │    │
│  │  CREATE INDEX ON suppliers(name);                       │    │
│  │                                                         │    │
│  │  Index structure:                                       │    │
│  │                                                         │    │
│  │         [Root: "M"]                                     │    │
│  │        /        \                                       │    │
│  │   [H]          [R]                                      │    │
│  │  /   \        /   \                                     │    │
│  │ H...  M...   R...   Z...   ← Leaf pages point to       │    │
│  │                    table rows (ctid = file,page,offset) │    │
│  │                                                         │    │
│  │  Lookup: O(log N) — typically 3-4 page reads            │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ INDEX TYPES IN POSTGRES                                 │    │
│  │                                                         │    │
│  │  B-Tree (default)   →  <, >, =, BETWEEN, ORDER BY      │    │
│  │  Hash               →  = only (faster for equality)     │    │
│  │  GiST               →  Geometric, full-text, ranges     │    │
│  │  GIN                →  Arrays, JSONB, full-text         │    │
│  │  BRIN               →  Huge tables, correlated data     │    │
│  │  SP-GiST            →  Partitioned space (quad-trees)   │    │
│  │                                                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ COMPOSITE INDEXES (Multi-column)                        │    │
│  │                                                         │    │
│  │  CREATE INDEX ON purchase_orders(supplier_id, date);   │    │
│  │                                                         │    │
│  │  Helps: WHERE supplier_id = ? AND date > ?             │    │
│  │  Helps: WHERE supplier_id = ?                          │    │
│  │  ❌ Does NOT help: WHERE date > ? (leading column missing)│
│  │                                                         │    │
│  │  🎯 RULE: Put most selective / equality columns FIRST  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ YOUR ACTUAL ADDIS CROWN INDEXES (VERIFIED 2026-08-08)  │    │
│  │ — I checked your real local databases; here's what     │    │
│  │ EXISTS today — all created automatically by PK/UNIQUE: │    │
│  │                                                         │    │
│  │  addiscrown_local (main ERP):                          │    │
│  │  suppliers_pkey         →  PK on id                    │    │
│  │  products_pkey          →  PK on id                    │    │
│  │  products_sku_key       →  UNIQUE on sku               │    │
│  │  purchase_orders_pkey   →  PK on id                    │    │
│  │  purchase_orders_po_number_key → UNIQUE on po_number   │    │
│  │  sales_orders_pkey, order_number_key                   │    │
│  │  customers_pkey, customer_code_key                     │    │
│  │  journal_entries_pkey, entry_number_key                │    │
│  │  warehouse_receipts_pkey, receipt_number_key           │    │
│  │  chart_of_accounts_pkey, account_code_key              │    │
│  │  crm_opportunities_pkey, inventory_transactions_pkey   │    │
│  │                                                         │    │
│  │  addiscrown_procurement_local (NEW from merged branch):│    │
│  │  esic_categories_pkey, code/parent/level indexes       │    │
│  │  products_pkey, sku/category/active indexes            │    │
│  │  budgets_pkey, category/fiscal_year/status indexes     │    │
│  │  approval_workflow_* tables with full index sets       │    │
│  │  purchase_requisitions_pkey, number/status/date indexes│    │
│  │  purchase_orders_pkey, po_number/supplier/requisition  │    │
│  │  purchase_order_items_pkey, po_id/product/requisition  │    │
│  │  supplier_quotations_pkey, number/supplier/requisition │    │
│  │  budget_commitments_pkey, tenant/budget/reference      │    │
│  │  warehouse_receipts_pkey, number/po/status/category    │    │
│  │  warehouse_receipt_items_pkey, receipt/po_item/product │    │
│  │  suppliers_pkey, supplier_code/tenant unique index     │    │
│  │                                                         │    │
│  │  ⚠️ NOTE: addiscrown_local has NO index on             │    │
│  │  purchase_orders.supplier_id (it's used in WHERE/JOIN  │    │
│  │  — it DESERVES one). And there's NO products.supplier_ │    │
│  │  id column at all.                                     │    │
│  │                                                         │    │
│  │  💡 RECOMMENDED ADDITIONS (my genuine suggestion):      │    │
│  │  CREATE INDEX ON products(selling_price);              │    │
│  │     -- helps your Engagement L1-A price query          │    │
│  │  CREATE INDEX ON purchase_orders(supplier_id);         │    │
│  │     -- helps supplier lookups & future FK               │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### PILLAR 8: TRANSACTIONS — "Atomic Renovation"

```
┌─────────────────────────────────────────────────────────────────┐
│  🌰 ATOMIC: Transaction = **sequence of operations as ONE unit**│
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ ANATOMY OF A TRANSACTION                                │    │
│  │                                                         │    │
│  │  BEGIN;                    -- Start transaction         │    │
│  │    statement 1;            -- Part of transaction       │    │
│  │    statement 2;            -- Part of transaction       │    │
│  │    ...                     -- Part of transaction       │    │
│  │  COMMIT;                   -- Make permanent            │    │
│  │  -- OR --                                               │    │
│  │  ROLLBACK;                 -- Undo everything           │    │
│  │                                                         │    │
│  │  SAVEPOINT name;           -- Partial rollback point    │    │
│  │  ROLLBACK TO name;         -- Undo to savepoint         │    │
│  │  RELEASE name;             -- Remove savepoint          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ IMPLICIT VS EXPLICIT TRANSACTIONS                       │    │
│  │                                                         │    │
│  │  Implicit (autocommit=on, default):                     │    │
│  │    Each statement = own transaction                     │    │
│  │    INSERT ...;  -- auto-committed                       │    │
│  │                                                         │    │
│  │  Explicit (BEGIN...COMMIT):                             │    │
│  │    BEGIN;                                               │    │
│  │    INSERT ...;  -- not visible to others yet            │    │
│  │    UPDATE ...;  -- not visible to others yet            │    │
│  │    COMMIT;  -- all visible atomically                   │    │
│  │                                                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ TRANSACTION IN YOUR CODE (Node.js + pg)                 │    │
│  │                                                         │    │
│  │  const client = await pool.connect();                   │    │
│  │  try {                                                  │    │
│  │    await client.query('BEGIN');                         │    │
│  │    await client.query('INSERT INTO orders ...');        │    │
│  │    await client.query('UPDATE inventory SET qty=qty-1');│    │
│  │    await client.query('COMMIT');                        │    │
│  │  } catch (e) {                                          │    │
│  │    await client.query('ROLLBACK');                      │    │
│  │    throw e;                                             │    │
│  │  } finally {                                            │    │
│  │    client.release();                                    │    │
│  │  }                                                      │    │
│  │                                                         │    │
│  │  🎯 THIS PATTERN = YOUR FUTURE STANDARD                 │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ ADDIS CROWN EXAMPLE: POSTING A SALE (REAL tables!)      │    │
│  │  (columns verified against your actual schema)         │    │
│  │                                                         │    │
│  │  BEGIN;                                                 │    │
│  │    -- 1. Create the sales order (lines live in items   │    │
│  │    --    as JSONB; there is NO separate lines table)   │    │
│  │    INSERT INTO sales_orders                            │    │
│  │      (order_number, customer_id, customer_name,        │    │
│  │       order_date, total_amount, status, items)         │    │
│  │    VALUES ('SO-1042', '7', 'Alem Coffee Co.',          │    │
│  │            '2026-08-08', 25000.00, 'posted',           │    │
│  │            '[{"sku":"SKU-1003","qty":2,"price":12500}]');│
│  │                                                         │    │
│  │    -- 2. Record the inventory movement (there is no    │    │
│  │    --    "stock" column on products — quantity lives   │    │
│  │    --    in inventory_transactions like a ledger)      │    │
│  │    INSERT INTO inventory_transactions                  │    │
│  │      (product_id, transaction_type, quantity,          │    │
│  │       reference_type, reference_id)                    │    │
│  │    VALUES ('SKU-1003', 'sale', -2, 'sales_order',      │    │
│  │            'SO-1042');                                 │    │
│  │                                                         │    │
│  │    -- 3. Post the accounting entry (double-entry)      │    │
│  │    INSERT INTO journal_entries                         │    │
│  │      (entry_number, entry_date, entry_type, status,    │    │
│  │       total_debit, total_credit,                       │    │
│  │       reference_type, reference_id)                    │    │
│  │    VALUES ('JE-9001', '2026-08-08', 'sale', 'posted',  │    │
│  │            25000.00, 25000.00, 'sales_order', 'SO-1042');│
│  │                                                         │    │
│  │  COMMIT;  -- All succeed or ALL vanish                 │    │
│  │                                                         │    │
│  │  If step 2 fails → ROLLBACK → no order, no inventory  │    │
│  │  movement, no journal entry. All three stay in lockstep│    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### PILLAR 9: CONCURRENCY — "Many Cashiers, One Register"

```
┌─────────────────────────────────────────────────────────────────┐
│  🌰 ATOMIC: Concurrency = "many people using the data store       │
│  at once, and every one sees a CORRECT answer."                 │
│                                                                  │
│  Why it matters in Addis Crown:                                 │
│  Two cashiers sell the last widget at the same second.          │
│  Both should NOT be able to sell it.                            │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ THE CLASSIC BUG: LOST UPDATE                            │    │
│  │                                                         │    │
│  │  (illustrative — Addis tracks stock as a transaction    │    │
│  │   ledger, but the same race applies to 'total on hand') │    │
│  │  Cashier A:   read on-hand → 1                          │    │
│  │  Cashier B:   read on-hand → 1                          │    │
│  │  Cashier A:   INSERT a sale → on-hand becomes 0        │    │
│  │  Cashier B:   INSERT a sale → should have been 0, but  │    │
│  │               both thought 1 available                  │    │
│  │  -- Both sold the same last unit. One sale was LOST.    │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ PostgreSQL's ANSWER: MVCC (Multi-Version Concurrency    │    │
│  │ Control)                                                │    │
│  │                                                         │    │
│  │  Instead of locking the whole table, Postgres keeps     │    │
│  │  MULTIPLE VERSIONS of each row.                        │    │
│  │                                                         │    │
│  │  • Every row has hidden flags: which transaction wrote  │    │
│  │    this version, and which transaction deleted it.     │    │
│  │  • Transaction A sees ONE snapshot of the data.        │    │
│  │  • Transaction B sees its OWN snapshot.                │    │
│  │  • Writers don't block readers. Readers don't block    │    │
│  │    writers.                                            │    │
│  │  • Old unused versions are cleaned by VACUUM later.    │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ ISOLATION LEVELS (knobs you can turn)                   │    │
│  │                                                         │    │
│  │  READ COMMITTED  (default)                              │    │
│  │   · Each statement sees a fresh snapshot of committed  │    │
│  │     data only. Most apps use this.                     │    │
│  │  REPEATABLE READ                                        │    │
│  │   · Whole transaction sees the SAME snapshot.          │    │
│  │  SERIALIZABLE                                          │    │
│  │   · Strongest; transactions behave as if serial.       │    │
│  │     May need retries on conflicts.                     │    │
│  │                                                         │    │
│  │  ⚠️ Postgres always enforces at least READ COMMITTED. │    │
│  │  (Even if you SAY "read uncommitted", it treats it as  │    │
│  │   READ COMMITTED — dirty reads never happen.)         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ SAFE ATOMIC PATTERN (best practice — think & verify)    │    │
│  │                                                         │    │
│  │  Do the UPDATE with a GUARD in the WHERE so it only    │    │
│  │  succeeds when the precondition is still true:         │    │
│  │                                                         │    │
│  │  UPDATE products                                        │    │
│  │     SET selling_price = 0   -- (toy example)            │    │
│  │   WHERE sku = 'X' AND active = true;                    │    │
│  │  -- If 0 rows changed → a check failed. Check it!      │    │
│  │                                                         │    │
│  │  🧠 In Postgres, a properly-guarded write combined      │    │
│  │  with a transaction and correct isolation level is how │    │
│  │  you prevent lost updates in your own code.            │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### PILLAR 10: SECURITY & ACCESS — "Locks, Keys, and a Doorman"

```
┌─────────────────────────────────────────────────────────────────┐
│  🌰 ATOMIC: Security = "who is allowed to do what, with which    │
│  data — enforced by the database ITSELF, not just your app."    │
│                                                                  │
│  🔑 Layered castle model:                                       │
│  1. NETWORK  — only trusted IPs/port reach Postgres.           │
│  2. WRAPPED  — TLS/SSL encrypts data in transit (Neon uses this)│
│  3. AUTH     — must PROVE who you are (password / token).      │
│  4. ROLE     — after you're in, what CAN you do?               │
│  5. ROW-MASK — can you see only SOME rows? (row-level security)│
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ ROLES & PRIVILEGES                                      │    │
│  │   CREATE ROLE app_user WITH LOGIN PASSWORD '...';      │    │
│  │   GRANT SELECT, INSERT ON suppliers TO app_user;       │    │
│  │   REVOKE DELETE ON suppliers FROM app_user;            │    │
│  │   -- 'ja' in your setup is SUPERUSER (master key).     │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ ROW-LEVEL SECURITY (multi-tenant magic)                 │    │
│  │                                                         │    │
│  │  ALTER TABLE sales_orders ENABLE ROW LEVEL SECURITY;   │    │
│  │  CREATE POLICY tenant_only ON sales_orders             │    │
│  │  USING (tenant_id = current_setting('app.tenant'));    │    │
│  │  -- Each tenant only ever sees their own rows           │    │
│  │  -- This is EXACTLY how a multi-tenant ERP isolates.   │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  RULE OF THUMB: least privilege — give the minimum needed.     │
└─────────────────────────────────────────────────────────────────┘
```

### PILLAR 11: BACKUP & RECOVERY — "The Spare Copy in the Fireproof Safe"

```
┌─────────────────────────────────────────────────────────────────┐
│  🌰 ATOMIC: A backup is a stored copy. Recovery is how you bring│
│  it back. If you can't restore, the backup doesn't exist.   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ PHYSICAL vs LOGICAL backups                             │    │
│  │                                                         │    │
│  │  LOGICAL: pg_dump                                       │    │
│  │   · Spits out a .sql or .dump of the data & schema.    │    │
│  │   · Easy to read, move between versions.               │    │
│  │   · pg_dump dbname > db.sql;  pg_restore db.sql        │    │
│  │                                                         │    │
│  │  PHYSICAL: copy the actual files + WAL log              │    │
│  │   · Bit-for-bit copy. Faster to restore, exact replica. │    │
│  │   · pg_basebackup (used by Neon behind the scenes).    │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ THE WAL (Write-Ahead Log) — your safety net            │    │
│  │                                                         │    │
│  │  Every write is appended to the WAL FIRST, THEN applied│    │
│  │  to the table. If the machine crashes mid-write, on     │    │
│  │  restart the WAL replays and the data is still correct.│    │
│  │  Doing this before writing is why Postgres rarely       │    │
│  │  corrupts itself on power loss.                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  🎯 YOUR PROJECT:                                            │
│  Neon already keeps continuous backups & point-in-time.         │
│  On LOCAL, take a pg_dump before you experiment.                    │
└─────────────────────────────────────────────────────────────────┘
```

### PILLAR 12: PERFORMANCE & TUNING — "The Garage Tune-Up"

```
┌─────────────────────────────────────────────────────────────────┐
│  🌰 ATOMIC: Performance = "same answer, faster, using fewer      │
│  resources." A slow database makes a great app feel broken.    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ THE #1 TOOL: EXPLAIN                                    │    │
│  │                                                         │    │
│  │  EXPLAIN ANALYZE SELECT * FROM suppliers WHERE ...;     │    │
│  │  -- shows how Postgres plans & executes your query      │    │
│  │  -- is it scanning the whole table? (seq scan)          │    │
│  │  -- is it using an index? (index scan)                  │    │
│  │  -- estimated vs actual row counts                      │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ QUICK WIN LIST (in order of effect)                     │    │
│  │  1. Add the RIGHT INDEX (most common fix)               │    │
│  │     CREATE INDEX ON sales_orders(customer_id,           │    │
│  │                                created_at);             │    │
│  │  2. Keep statistics fresh:  ANALYZE;  VACUUM;         │    │
│  │  3. Only SELECT the columns you need (avoid SELECT *) │    │
│  │  4. Use LIMIT when you only need top rows              │    │
│  │  5. Avoid functions AROUND a column in WHERE — they    │    │
│  │     block index use:  WHERE lower(name) = 'x'  can't  │    │
│  │     use a plain index on name; use an expression index│    │
│  │     (CREATE INDEX ON suppliers (lower(name))) instead  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ⚠️ AUTHENTIC PHRASE: Tuning starts AFTER the query is logical. │
│  An index never fixes bad logic.                                │
└─────────────────────────────────────────────────────────────────┘
```

---

# 🌱 PART 3 — ROOT 3: CORE TERMINOLOGY (with roles + full-stack position)

| Term | 👶 Sprinkle sentence | 🧱 Real technical meaning | Your role in Addis |
|---|---|---|---|
| **Database** | "The whole toy box." | Collection of related data managed by a DBMS. | A single `addiscrown_local` DB. |
| **DBMS** | "The toy box keeper robot." | Software that stores/manages data (Postgres, MySQL, Neon). | PostgreSQL 17 on localhost. |
| **Table** | "One drawer in the toy box." | 2D rows + columns holding records of one kind. | `suppliers`, `products`. |
| **Row / Record** | "One toy in the drawer." | One tuple; a complete fact. | One supplier row. |
| **Column / Field** | "The label on each drawer." | A typed attribute shared by all rows. | `name`, `email`. |
| **Primary Key** | "The unique name-tag." | Uniquely identifies a row; NOT NULL + UNIQUE. | `id` on `suppliers`. |
| **Foreign Key** | "A tag pointing to another toy." | Column referencing another table's PK. | `supplier_id` → `suppliers.id`. |
| **Schema** | "The plan folder inside the box." | Namespace; also a blueprint of tables. | `public` schema. |
| **Index** | "The alphabetical card catalog." | Aux data structure for fast lookup. | index on `sku`. |
| **Query** | "Asking the box a question." | A SQL statement the DB executes. | `SELECT * FROM suppliers;` |
| **Transaction** | "A group of moves, all or nothing." | A single unit of work, ACID. | Posting a sale in one `BEGIN…COMMIT`. |
| **Commit** | "Stamp SAVED." | Permanently writes the transaction. | from your API at the end of a write. |
| **Rollback** | "Take it all back." | Undo a transaction. | on error, in your tx catch block. |
| **Connection** | "The pipe from app to box." | A live client socket to the DB. | a `Pool` in Node. |
| **Pool** | "A bundle of pipes to share." | Reusable connections to save setup cost. | `pg` Pool in your db client. |
| **Driver** | "The translator box." | A client library speaking the DB's wire protocol. | `pg` package. |
| **ORM** | "A magic bridge making tables look like JS objects." | Maps tables → objects; Prisma, TypeORM… | (later module). |
| **Migration** | "A saved change to the drawer layout." | A versioned schema-change script. | `CREATE TABLE` / `ALTER`. |
| **Tenant** | "One family's private box." | An isolated "owner" of data. | `tenant_id` column & RLS. |
| **Vacuum** | "The recycling truck." | Cleans up dead MVCC rows and bloat. | automatic, but watch tables. |

**Full-stack coordinates for a request:**
```
React (UI)  →  API fn  →  Pool/Driver →  SQL  →  Table/Index →  Rows back
    T1           T2            T3        T4         T5             T6
```

---

# 🌱 PART 4 — THE HANDS-ON VERSION: CRUD FROM KEYSTROKE TO DISK

## 4.1 READ — `SELECT` — "Show me what's in the drawer"

- `SELECT` = READ from the DB. Think phone: "show me my contacts".
- It never changes data — it returns (reads) data.
- The very first command you should master, because every CRUD
  tool (and the VALIDATE loop below) leans on it.

**Every SELECT builds like this:**
```
SELECT   name, email          ← which columns (the "WHAT")
FROM     suppliers            ← which table (the "WHERE FROM")
WHERE    country = 'Ethiopia' ← which rows (the "WHICH")
ORDER BY name                 ← the sort
LIMIT    5                    ← the cap
```

**Real runs against `addiscrown_local`:**
```sql
-- all columns
SELECT * FROM suppliers;

-- only some columns
SELECT name, city FROM suppliers;

-- only Ethiopian row
SELECT * FROM suppliers WHERE country = 'Ethiopia';

-- most expensive products
SELECT * FROM products ORDER BY selling_price DESC LIMIT 3;
```

> 💡 Try each of the above in the Query Tool and watch the result grid.

## 4.2 CREATE — `INSERT` — "Put a new toy in the drawer"

`INSERT` literally plants a NEW row. It's the C in CRUD.

**Anatomy:**
```sql
INSERT INTO suppliers (column1, column2, ...)
VALUES ('v1', 'v2', ...);
```

**Safe, repeatable version (used by your own seeders):**
```sql
INSERT INTO suppliers (id, supplier_code, name, email, phone, city, country, active, tenant_id)
VALUES ('sup-006', 'SUP-006', 'Horn of Africa Foods', 'orders@horn.com',
        '+251-1-999-8888', 'Addis Ababa', 'Ethiopia', true, 'tenant_default')
ON CONFLICT (id) DO NOTHING;   -- if the id already exists, skip silently
```

> 🎯 The `ON CONFLICT DO NOTHING` makes the INSERT **idempotent** — you can run the
> seed script a hundred times safely. It's like saying "if my drawing is already on
> the fridge, don't paint it again."

## 4.3 UPDATE — "Edit the book with a pen"

```sql
UPDATE products
   SET selling_price = selling_price + 500
 WHERE sku = 'SKU-1001';   -- ⚠️ WITHOUT WHERE you edit EVERY row
```

## 4.4 DELETE — "No, take that book out"

```sql
DELETE FROM products WHERE sku = 'SKU-1001';   -- remove that one row
-- ⚠️ if you omit WHERE, the whole table empties. Dangerous.
```

## 4.5 The VALIDATE loop (your new superpower)

After EVERY write, re-read the data to prove it took effect:

```sql
SELECT * FROM suppliers WHERE id = 'sup-006';  -- after INSERT
-- then UPDATE it, then SELECT it again
-- then DELETE it, then SELECT it again → 0 rows
```

> This "write then verify" loop is what professionals call **data validation**, and
> it is exactly how you'll catch bugs before they reach users.

---

# 🌱 PART 5 — Apprenticeship Engagement L1-A (15 points) — REAL PROJECT

Do all of it in pgAdmin, connected to `addiscrown_local`.

**User story:** "The sales target needs a list of all retail products above 5,000 ETB,
plus which ones are low on stock (below reorder level 15)."

```sql
SELECT sku, name, selling_price
FROM products
WHERE selling_price > 5000
  AND reorder_level < 15
ORDER BY selling_price;
```

Then:
1. Insert a **temporary "demo" supplier**.
2. Update its city.
3. Delete it.
4. Prove each step with a `SELECT`.

**Report back to me:** the SELECT result, the "rows changed" messages, and one
sentence: what worked / failed and why (mention `ON CONFLICT`).

**Scoring:** 10 for correct SQL + working output, 5 for a clear explanation.

---

# 🌱 PART 6 — Self-Check Quiz (be honest, not clever)

1. Name the three layers a database lives in.
2. Which 4 of the 12 pillars stand on their own to protect data?
3. What does ACID mean — one line each.
4. Difference between a PRIMARY KEY and a FOREIGN KEY?
5. Describe in your own words: why does `ON CONFLICT DO NOTHING` exist?
6. What is the single most dangerous mistake you can make with `UPDATE` / `DELETE`?
7. Why does indexing speed some queries up, but slow writes down?

**Answers are hidden in the pillars above — if you can walk a beginner through
question 1, you really know it.**

---

# 🌱 PART 7 — Module Scorecard + Wrap-Up

| Segment | Points avail | Your score | Notes |
|---|---|---|---|
| Section 1 — What is a DB | 4 | | |
| Section 2 — 12 pillars | 6 | | |
| Section 3 — Terminology | 4 | | |
| Section 4 — CRUD hands-on | 10 | | |
| Section 5 — Compatibility | 2 | | |
| Section 6 — Engage L1-A | 15 | | **TOTAL** |
| Self-check (friendlier) | — | — | |
| **Module total** | **~41 possible** | | → mapped to **25 graded /100** |

*(Raw module points normalize to the 25/100 curriculum weight.)*

---

## 🏁 Wrap-Up — What You Now Own
- You can DEFINE a database from atom → ecosystem.
- You can NAME the 12 pillars and say what each protects.
- You know 20+ terms and where each lives in the stack.
- You've seen a real `SELECT / INSERT / UPDATE / DELETE` against your own DB.
- You can VALIDATE your writes and explain why `ON CONFLICT` matters.

**Next:** `MODULE_L2_SCHEMA_AND_TX.md` — schema design, normalization, ACID & transactions (a tutorial version will be available too).

---
## 📌 Status: TUTORIAL READY — read thoroughly, then do the Engagement and report for scoring.