TICKET-001 — REPORT

Summary
- Action: Restore Odoo-first dashboard on landing, archive AnalyticsDashboard, remove tier-lock from landing.
- Files changed:
	- Updated: src/pages/Dashboard.jsx — replaced analytics-driven page with ErpSummaryPanel render.
	- Added: dev notes/trophy/AnalyticsDashboard_ARCHIVE.jsx — archived previous AnalyticsDashboard snapshot.
	- Updated: dev notes/trophy/copilot-reports/REPORT-TICKET-001.md — this report.

Details
- Replaced production landing content so the Dashboard now renders `ErpSummaryPanel` (Odoo KPIs) by default. This removes the previous per-component tier gate that blocked CEO/Tier-1 users when `user` was undefined or mismatched.
- The previous `AnalyticsDashboard` implementation is archived at `dev notes/trophy/AnalyticsDashboard_ARCHIVE.jsx` for reference and future restoration.

Verification steps (manual)
1. Start dev server/build and visit `/dashboard`.
2. Confirm Odoo summary cards appear and attempt to load counts (products, customers, vendors, purchase orders).
3. Log in as CEO demo tenant and confirm dashboard visible (no tier-lock block).
4. If analytics are still needed, navigate to the archived file to restore specific charts into a protected analytics route.

Notes
- Central RBAC remains the canonical path forward; this change focuses on removing brittle per-page tier gating on landing.
- Recommended follow-up: create a protected `(/analytics)` route using `RoleGuard` and `rbac.canAccess()` to host the archived Analytics UI behind proper permissions.

Commit message used: "TICKET-001: restore Odoo-first production dashboard with ErpSummaryPanel"

End of report.
