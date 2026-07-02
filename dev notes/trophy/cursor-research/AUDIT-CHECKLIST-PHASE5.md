# AUDIT-CHECKLIST — Phase 5 (Core 4 Modules Only)

**Author:** Cursor  
**For:** TICKET-012  
**Source:** `dev notes/history/expected 5 batch execution outcomes.md` (filtered)

---

## Scope filter

Only checklist items relating to **Inventory, Sales, Purchase, Finance, Dashboard, Global auth/proxy** — not HR/MRP/CRM depth.

---

## 1. Global architecture

| # | Check | Agent | User | Ticket |
|---|-------|-------|------|--------|
| G1 | Odoo via `/api/odooProxy` | [x] | | 004 |
| G2 | Unauthenticated deep link → `/login` | [x] | | 001+ |
| G3 | Logout → `/login` | [x] | | prior |
| G4 | Cold-start wake-up message | [x] | | prior |
| G5 | i18n toggle works | [x] | | 001+ |
| G6 | No secrets in frontend bundle | [x] | | 004 |

---

## 2. Dashboard

| # | Check | Agent | User | Ticket |
|---|-------|-------|------|--------|
| D1 | `/dashboard` renders without crash | [x] | | 001 |
| D2 | ErpSummaryPanel Odoo KPIs | [x] | | 001, 005 |
| D3 | Recent SO widget | [x] | | 010 |
| D4 | Low stock widget | [x] | | 010 |

---

## 3. Inventory

| # | Check | Agent | User | Ticket |
|---|-------|-------|------|--------|
| I1 | List from Odoo | [x] | | prior |
| I2 | Search filter | [x] | | prior |
| I3 | Create product | [x] | | 006 |
| I4 | Edit product | [x] | | 006 |

---

## 4. Sales

| # | Check | Agent | User | Ticket |
|---|-------|-------|------|--------|
| S1 | List SOs | [x] | | prior |
| S2 | Search/filter | [x] | | 007 |
| S3 | Create draft SO | [x] | | 007 |

---

## 5. Purchase

| # | Check | Agent | User | Ticket |
|---|-------|-------|------|--------|
| P1 | List POs | [x] | | prior |
| P2 | Create draft PO | [x] | | 008 |

---

## 6. Finance

| # | Check | Agent | User | Ticket |
|---|-------|-------|------|--------|
| F1 | Chart of accounts list | [x] | | 002, 009 |
| F2 | No engineering treasury UI | [x] | | 002 |
| F3 | Policy-gated access | [x] | | 003, 011 |

---

## Sign-off (TICKET-012)

Cursor marks Agent column; Commander marks User column; all core rows must be checked before M1 gate.
