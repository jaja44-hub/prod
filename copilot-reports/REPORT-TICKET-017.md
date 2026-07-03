# REPORT - TICKET-017: Server-side tenant Odoo domain injection in proxy

Summary

- Implemented server-side tenant Odoo domain injection for read/query Odoo methods in `api/odooProxy.js`.
- Added `api/lib/tenantOdooDomain.js` which loads `TENANT_ODOO_DOMAIN_MAP` from env, enforces a minimal allowlist (`company_id`) and exposes `getTenantDomainTerms` and `mergeOdooDomains`.
- Added `scripts/test_tenant_domain.mjs` and `npm run test:tenant-domain` to validate merge behavior and env parsing.
- Updated `api/odooProxy.js` to merge tenant terms into `args[0]` for methods: `search_read`, `search`, `read`, `name_search` and set `meta.tenantDomainApplied` in responses when applied.

Files added/modified

- Added: `api/lib/tenantOdooDomain.js`
- Added: `scripts/test_tenant_domain.mjs`
- Modified: `api/odooProxy.js` (apply tenant domain merge, add meta flag)
- Modified: `package.json` (add `test:tenant-domain` script)
- Added: `copilot-reports/REPORT-TICKET-017.md` (this file)

Environment variable

- `TENANT_ODOO_DOMAIN_MAP` (optional): JSON mapping of tenant id to default and per-model domain arrays. Example:

```json
{
  "production": {},
  "demo": {
    "default": [["company_id","=",1]],
    "product.product": [["company_id","=",1]],
    "sale.order": [["company_id","=",1]]
  }
}
```

Notes & Decisions

- v1 allowlist restricts tenant domain terms to `company_id` only. Unknown fields in the env map are ignored.
- If `TENANT_ODOO_DOMAIN_MAP` is missing or invalid JSON, the proxy will treat it as empty (fail open for production), logging a warning but not crashing.
- Tenant domain merging is server-side only and driven by `tenantId` from verified Firebase token, not by client input.
- This change does not modify write operations (`create`/`write`/`unlink`) per the ticket scope.

Verification performed

- `npm run test:tenant-domain` — passed
- `npm run test:odoo-query` — all TICKET-014 checks passed
- `npm run build` — production build succeeded

Acceptance

- AC1: `api/lib/tenantOdooDomain.js` exports loader/getter/merge — done
- AC2: `odooProxy.js` merges tenant domain on read/search methods — done
- AC3: `production` tenant passthrough behavior preserved — validated by tests
- AC4: `tenantId` drives lookup — implemented
- AC5: `test:tenant-domain` passes — done
- AC6: `test:odoo-query` passes — done
- AC7: `npm run build` passes — done
- AC8: Report documents env var and meta flag — done

Next steps

- (TICKET-018) Implement Firestore-backed tenant map and expand allowlist as needed.
- Optionally add logging or metrics for `tenantDomainApplied` to monitor tenant scoping.

Commit

- `TICKET-017: Server-side tenant Odoo domain injection in proxy`
