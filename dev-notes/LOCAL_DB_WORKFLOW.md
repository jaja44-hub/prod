# Local ↔ Remote Database Workflow (Addis Crown ERP)

**Goal:** Develop, create, update, and test against a **local** Postgres 17
database (`addiscrown_local`) so your Neon free-tier read/write limits stay
untouched. Push to remote only when you deliberately want to.

---

## 1. The two environments

| | LOCAL (dev) | REMOTE (Neon, production) |
|---|---|---|
| Host | `127.0.0.1:5432` | Neon cloud (in `.env`, untouched) |
| Database | `addiscrown_local` | Neon DB(s) |
| User | `ja` (password `localdev`) | Neon role (in `.env`) |
| Config file | **`.env.local`** (gitignored, new) | **`.env`** (untouched) |
| Cost | Free, unlimited reads/writes | Free-tier limits (monthly) |

Local config lives in `.env.local`. The remote config stays in `.env`.
**Nothing we did touches `.env` or the Neon databases.**

---

## 2. How to point a command at LOCAL

Every command that reads env vars will use **remote** (`.env`) by default.
To force **local**, load `.env.local` first:

```bash
set -a; source .env.local; set +a; <your-command>
```

Examples:

```bash
# Seed / re-seed the local database (idempotent)
set -a; source .env.local; set +a; node seed-neon-local.mjs

# Run the local server against local Postgres
set -a; source .env.local; set +a; npm run dev
```

> The server's `neonClient.js` reads `NEON_DATABASE_URL`. In `.env.local`
> we point that at local Postgres, so any local run that uses
> `queryNeon()` will hit your local DB — not Neon.

---

## 3. Everyday local workflow

### Browse / query the data
- **pgAdmin 4:** register "Local Addis Crown" (see `scripts/pgadmin-config_local.py`)
  -> Databases -> `addiscrown_local` -> Schemas -> public -> 10 tables.
- **psql:**
  ```bash
  PGPASSWORD='localdev' psql -h 127.0.0.1 -p 5432 -U ja -d addiscrown_local
  ```

### Create / alter tables, insert / update / delete — do it locally
Use pgAdmin's Query Tool, or psql, or write a Node script that runs against
`.env.local`. When the schema change is verified locally, replicate the DDL
against Neon when you're ready to push (see §5).

### Reset the local DB to clean seed data
Re-running the seeder is always safe: it uses `CREATE TABLE IF NOT EXISTS`
and `ON CONFLICT ... DO NOTHING`, so it never errors and never duplicates
rows. **But it does NOT delete rows you added** — it only fills in missing
seed rows. To truly reset (wipe your test data and reseed fresh):

```bash
# 1) Drop + recreate (fastest clean reset)
set -a; source .env.local; set +a; node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
(async () => {
  const r = await pool.query(\"SELECT tablename FROM pg_tables WHERE schemaname='public'\");
  for (const t of r.rows) await pool.query('DROP TABLE IF EXISTS ' + t.tablename + ' CASCADE');
  await pool.end();
  console.log('dropped', r.rows.length, 'tables');
})();
"

# 2) Reseed everything
set -a; source .env.local; set +a; node seed-neon-local.mjs
```

This only ever touches the DB in `DATABASE_URL` — which is local here.

---

## 4. Quick reference: connection values

```
Host:        127.0.0.1
Port:        5432
Database:    addiscrown_local
User:        ja
Password:    localdev
DATABASE_URL=postgresql://ja:localdev@127.0.0.1:5432/addiscrown_local
```

---

## 5. Pushing local changes to remote (Neon) — the safe way

Only push when a change is verified. Never push automatically.

1. Make + verify your change locally first (schema or seed data).
2. Diff what changed:
   ```bash
   PGPASSWORD='localdev' pg_dump -h 127.0.0.1 -p 5432 -U ja addiscrown_local --schema-only
   ```
3. Apply the same DDL to Neon explicitly (run it in the Neon SQL editor or
   a one-off script with the real `NEON_DATABASE_URL`).
4. Verify on Neon.

> Keep `DATABASE_URL`/`NEON_DATABASE_URL` pointed at local during dev.
> Only swap to the remote value for the explicit push step — and note the
> remote values live in `.env` (never edit them casually).

---

## 6. Files involved

| File | Role | Git status |
|---|---|---|
| `.env.local` | Local-only connection overrides | **gitignored** (added) |
| `.env` | Remote Neon creds | untouched, still gitignored |
| `.gitignore` | Added `.env.local` entry | tracked |
| `seed-neon-local.mjs` | Creates + seeds 10 tables | unchanged |
| `scripts/pgadmin-config_local.py` | pgAdmin server definition + GUI guide | new |
