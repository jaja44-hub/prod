# Interim S7 into S8 Task Fulfilment Roadmap
## Comprehensive Plan for Category A Execution & Category B Reconciliation

**Document Version**: 1.0
**Created**: 2026-08-14
**Status**: Active Execution Plan
**Context**: Post-S7 completion, pre-S8 execution bridge

---

## Executive Summary

This roadmap bridges the gap between completed S7 execution (auth fix, database sync, Firestore rules, basic mutations working) and the upcoming S8 strategic execution. It captures the immediate Category A fixes needed to make all create/update/edit/add operations functional across all modules/roles, and provides the framework for Category B strategic development.

**Key Principles:**
- Category A: Immediate fixes - minimal, surgical, deployable in 1-2 sessions
- Category B: Strategic development - standard practice reviews, governance frameworks, advanced features
- All Category A fixes must be: tested locally, deployed to remote, committed to GitHub, verified in production

---

## Part 1: Memory Updates - User's Two Critical Comments

### Comment 1: Pipeline Connections (Category A Scope Expansion)
> **Original**: "Verify & Fix Pipeline Connections - Requisition→Quotes→Orders→Receipts→Inventory flow"
> 
> **User's Clarification**: These UI and database side scaffolds should be FULLY erected with making them available in UI side operational UI interactions and end-to-end connections for ALL modules, ALL operations and roles. While "who requests what" shall be addressed later in Category B for dictating who requests what for whom based on staff engagement and tenant sector engagement logics. But at THIS time "requests" should be available in ALL modules, roles and action lifecycles that will be tailored to day-to-day plus periodic engagements and needs of staffs and personals of tenant enterprises.
> 
> **Examples Given**:
> - Sales may request dispatch of products (finished goods) for warehouse directly or through sales department head
> - Production room head may request purchase of raw material based on stock levels, budget and daily production plan
> 
> **Implementation Requirement**: Make "requests" available in ALL modules, roles and action lifecycles with some degree of detailedness to tailor them with immediate connotations. Seamlessly make this part of Category A execution scopes and logical burdens.

**Action Items:**
- [ ] Ensure Requisition creation available in ALL modules (not just Purchase)
- [ ] Ensure Quote creation/selection available from Requisitions
- [ ] Ensure Order creation from Quotes/Requisitions works across modules
- [ ] Ensure Receipt creation from Orders works (Warehouse → Inventory)
- [ ] Ensure Inventory dispatch/request available for Sales, Production, etc.
- [ ] Add "Request" action buttons/menus in ALL module UIs
- [ ] Verify role-based visibility (but NOT role-based restriction for Category A)

### Comment 2: ESIC Categories - Official Document Requirement
> **Original**: "Seed ESIC Categories - Missing raw materials, inputs, accessories, utilities, resale items per Ethiopian classifications"
> 
> **User's Requirement**: Permanently secure the official ESIC document from official source as developer resource reference book. Download latest official document with amendments from official source, save in root of project workspace as constant resource BEFORE moving to immediate Category A task executions.
> 
> **Implementation Requirement**: 
> - [x] ESIC reference document created: `ESIC_Ethiopian_Industrial_Sector_Classification_Reference.md`
> - [ ] Download official ESIC 2015 document from official Ethiopian source (MoTI/ESS)
> - [ ] Save as `ESIC_Official_Document.pdf` in project root
> - [ ] Use as reference for seeding `esic_categories` table

---

## Part 2: Category A - Immediate Execution Plan (This Session)

### Priority 0: Infrastructure Fixes (CRITICAL - Do First)

| Task | Description | Status | Est. Time |
|------|-------------|--------|-----------|
| **T0.1** | Fix Firestore Rules | ��� IN PROGRESS | 30 min |
| **T0.2** | Fix inventory_products NOT NULL constraint on sku | ��� PENDING | 30 min |
| **T0.3** | Fix inventory_products field name mismatch (product_code vs sku) | �� DONE | - |

### Priority 1: ESIC Categories Seeding (CRITICAL)

| Task | Description | Status | Est. Time |
|------|-------------|--------|-----------|
| **T1.1** | Download official ESIC 2015 document from MoTI/ESS | ��� PENDING | 30 min |
| **T1.2** | Save as `ESIC_Official_Document.pdf` in project root | ��� PENDING | 5 min |
| **T1.3** | Seed `esic_categories` table with full ISIC Rev 4 hierarchy adapted for Ethiopia | ��� PENDING | 1 hour |
| **T1.4** | Verify categories seeded in both local and remote Neon databases | ��� PENDING | 15 min |

### Priority 2: Pipeline Connections - Full UI + DB Scaffolds (PER USER COMMENT 1)

| Task | Description | Module | Status | Est. Time |
|------|-------------|--------|--------|-----------|
| **T2.1** | Requisition creation available in ALL modules | Purchase, Sales, Production, Inventory | ��� PENDING | 2 hours |
| **T2.2** | Quote creation/selection from Requisitions | Purchase | ��� PENDING | 1 hour |
| **T2.3** | Order creation from Quotes/Requisitions | Purchase, Sales | ��� PENDING | 1 hour |
| **T2.4** | Receipt creation from Orders (Warehouse → Inventory) | Purchase, Warehouse | ��� PENDING | 1 hour |
| **T2.5** | Inventory dispatch/request for Sales, Production | Sales, Production, Inventory | ��� PENDING | 2 hours |
| **T2.6** | "Request" action buttons in ALL module UIs | ALL modules | ��� PENDING | 2 hours |
| **T2.7** | Verify role-based visibility (no Category A restrictions) | ALL modules | ��� PENDING | 1 hour |

### Priority 3: Firestore Rules (CRITICAL - Blocks All Writes)

| Task | Description | Status | Est. Time |
|------|-------------|--------|-----------|
| **T3.1** | Deploy comprehensive Firestore rules to Firebase | ��� PENDING | 30 min |
| **T3.2** | Verify rules allow authenticated writes for all collections | ��� PENDING | 15 min |

### Priority 4: Inventory Products Schema Fix

| Task | Description | Status | Est. Time |
|------|-------------|--------|-----------|
| **T4.1** | Fix NOT NULL constraint on sku column (handle missing sku) | ��� PENDING | 30 min |
| **T4.2** | Verify createProduct works with both product_code and sku | �� DONE | - |

### Priority 5: End-to-End Testing

| Task | Description | Status | Est. Time |
|------|-------------|--------|-----------|
| **T5.1** | Test HR employee creation (POST /api/hr/employees) | ��� PENDING | 15 min |
| **T5.2** | Test Inventory product creation (POST /api/inventory/products) | ��� PENDING | 15 min |
| **T5.3** | Test Purchase Requisition creation | ��� PENDING | 15 min |
| **T5.4** | Test Purchase Order creation from Requisition | ��� PENDING | 15 min |
| **T5.5** | Test Warehouse Receipt from PO | ��� PENDING | 15 min |
| **T5.6** | Test Inventory dispatch for Sales/Production | ��� PENDING | 15 min |

### Priority 6: Deployment & Verification

| Task | Description | Status | Est. Time |
|------|-------------|--------|-----------|
| **T6.1** | Deploy to Vercel (all API changes) | ��� PENDING | 5 min |
| **T6.2** | Deploy Firestore rules to Firebase | ��� PENDING | 5 min |
| **T6.3** | Commit all changes to GitHub | ��� PENDING | 5 min |
| **T6.4** | Verify production API mutations work | ��� PENDING | 15 min |
| **T6.5** | User acceptance testing coordination | ��� PENDING | - |

---

## Part 3: Category B - Deferred for Standard Practice Reviews

### Governance & Workflow Engine (Post-Category A)
| Area | Standard Practice Source | Review Timeline |
|------|--------------------------|-----------------|
| Advanced Approval Workflows | BPMN 2.0, Workflow Patterns (van der Aalst) | Sprint 2 |
| Enterprise Governance Rules | COBIT 2019, ISO 38500, RACI matrices | Sprint 3 |
| Role-Based Access Control (RBAC) | NIST RBAC, ANSI INCITS 359 | Sprint 2 |
| Segregation of Duties (SoD) | COBIT DSS05, ISO 27001 A.6.1.2 | Sprint 3 |
| Multi-Level Delegation | Workflow delegation patterns, RACI-VS | Sprint 4 |

### Financial Control & Compliance
| Area | Standard Practice Source | Review Timeline |
|------|--------------------------|-----------------|
| Budget Control & Encumbrance | GFOA Best Practices, IFRS/IPSAS | Sprint 3 |
| Commitment Accounting | Government/Enterprise budgeting standards | Sprint 3 |
| Multi-Currency & FX | IFRS 21, IAS 21, Treasury best practices | Sprint 4 |
| Tax/VAT/Excise Engine | Ethiopian Tax Proclamation 285/2002, ERA guidelines | Sprint 3 |
| Multi-Currency Treasury | BIS Treasury Guidelines, IFRS 9 | Sprint 5 |

### Advanced Operational Modules
| Area | Standard Practice Source | Review Timeline |
|------|--------------------------|-----------------|
| Supplier Performance Scoring | ISO 9001, SRM Best Practices (Gartner/Forrester) | Sprint 4 |
| Multi-Location WMS | GS1 Standards, WMS Best Practices (MHI) | Sprint 4 |
| Inventory Valuation Methods | IFRS/IAS 2, GAAP, FIFO/LIFO/WA policies | Sprint 4 |
| Multi-Currency Treasury | BIS Guidelines, IFRS 9 Hedge Accounting | Sprint 5 |
| AI Supplier Risk Scoring | ISO 31000, NIST Risk Framework | Sprint 5 |

### Ethiopian Regulatory Compliance
| Area | Standard Practice Source | Review Timeline |
|------|--------------------------|-----------------|
| Ethiopian Tax Proclamation 285/2002 | ERA Official Publications | Sprint 2 |
| Ethiopian Customs & Trade Regulations | MoTRI, ECA Guidelines | Sprint 3 |
| Ethiopian Labor Law | Proclamation 1156/2019 | Sprint 3 |
| Data Protection (PDP) | Ethiopian PDP Proclamation (draft) | Sprint 3 |

---

## Part 4: Reconciliation with S7 & S8 Roadmaps

### S7 Completed (Reference)
- �� Auth fix (401→201)
- �� Database sync (5 Neon DBs → local)
- �� Firestore rules (comprehensive)
- �� Inventory.js field name fix (product_code + sku)
- �� .vercelignore fixes
- �� Database sync script

### S7→S8 Bridge (This Roadmap - Category A)
| Task | S7 Connection | S8 Preparation |
|------|---------------|----------------|
| Firestore Rules | �� S7 fix | Enables S8 UI writes |
| ESIC Categories | ��� Bridge task | Enables S8 categorization |
| Pipeline Scaffolds | ��� Bridge task | Enables S8 workflows |
| UI Scaffolds for All Modules | ��� Bridge task | Enables S8 role-based UI |

### S8 Strategic Execution (Post-Category A Completion)
| S8 Ticket | Description | Dependency |
|-----------|-------------|------------|
| S8-T1 | Governance Engine | Category A complete |
| S8-T2 | Advanced Workflow Engine | Category A + B reviews |
| S8-T3 | Advanced Budget Control | Category A + B reviews |
| S8-T4 | Multi-Currency & FX | Category A + B reviews |
| S8-T5 | AI Supplier Scoring | Category B reviews |

---

## Part 5: Execution Checklist - Session Tracking

### Pre-Execution Checklist
- [x] ESIC reference document created
- [ ] Official ESIC PDF downloaded
- [ ] Memory files updated with user comments
- [ ] Todo list initialized

### Execution Session 1: Infrastructure & ESIC
- [ ] Fix Firestore rules → Deploy to Firebase
- [ ] Fix inventory_products NOT NULL constraint
- [ ] Download official ESIC document
- [ ] Seed ESIC categories (local + remote)

### Execution Session 2: Pipeline Scaffolds
- [ ] Requisition creation in ALL modules
- [ ] Quote/Order/Receipt pipeline connections
- [ ] "Request" actions in ALL module UIs
- [ ] Role-based visibility (no restrictions)

### Execution Session 3: Testing & Deployment
- [ ] End-to-end testing all create/update operations
- [ ] Deploy to Vercel + Firestore
- [ ] Commit to GitHub
- [ ] Production verification

---

## Part 6: Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Firestore rules deployment fails | Medium | High | Test locally first, have rollback plan |
| ESIC seeding fails | Low | High | Use backup seed script, verify counts |
| Pipeline UI breaks existing UX | Medium | Medium | Feature flags, gradual rollout |
| Vercel deployment fails | Low | High | Test build locally first |
| GitHub push conflicts | Low | Medium | Pull before push, resolve conflicts |

---

## Part 7: Success Criteria for Category A Completion

| Criterion | Target |
|-----------|--------|
| All create/update mutations return 201/200 | 100% |
| Firestore writes allowed for authenticated users | 100% |
| ESIC categories seeded in local + remote | ≥200 categories |
| All modules have "Request" action available | 100% |
| Pipeline: Req→Quote→Order→Receipt→Inventory works | Verified |
| All mutations tested with valid Firebase tokens | 100% |
| Vercel deployment successful | Yes |
| GitHub commit pushed | Yes |
| User can test all create/update operations | Verified |

---

## Part 8: Sign-off & Handoff

### Category A Completion Sign-off
- [ ] All Priority 0-5 tasks completed
- [ ] All success criteria met
- [ ] User testing coordinated
- [ ] Documentation updated
- [ ] Category B task list finalized

### Handoff to Category B
- Documented gaps from Category A
- Standard practice review assignments
- Sprint planning for S8 execution
- Resource allocation for governance engine

---

## Appendix: Key Files & Resources

| File | Purpose | Location |
|------|---------|----------|
| `ESIC_Ethiopian_Industrial_Sector_Classification_Reference.md` | ESIC reference for development | Project root |
| `ESIC_Official_Document.pdf` | Official ESIC document (to be downloaded) | Project root |
| `firestore.rules` | Firestore security rules | Project root |
| `api/purchase.js` | Procurement API handlers | `/api/` |
| `src/pages/PurchaseOrders.jsx` | Purchase Orders UI | `/src/pages/` |
| `src/pages/PurchaseRequisitions.jsx` | Purchase Requisitions UI | `/src/pages/` |
| `src/pages/PurchaseOrderDetail.jsx` | PO Detail + Create UI | `/src/pages/` |
| `src/pages/Vendors.jsx` | Supplier Management UI | `/src/pages/` |
| `src/lib/neonPurchaseAPI.js` | API client | `/src/lib/` |
| `src/lib/procurementDepth.js` | Pipeline logic | `/src/lib/` |

---

*End of Interim S7 into S8 Task Fulfilment Roadmap*

*This document is a living document - update as tasks progress and new insights emerge.*
