# Odoo Module Activation Guide

## Manual Activation Instructions

Since programmatic activation encountered a domain syntax issue with Odoo 19.0, please use the web UI for manual activation.

### Step 1: Access Odoo Apps
1. Go to: https://jafiface-addis-crown-erp.hf.space/odoo/apps
2. Login with: `admin` / `admin`

### Step 2: Activate Required Modules

Search for and activate each of these modules in order:

#### 1. Sales Management
- Search: "Sales" or "sale_management"
- Click "Activate" button
- Wait for installation to complete

#### 2. Purchase Management  
- Search: "Purchase" or "purchase_management"
- Click "Activate" button
- Wait for installation to complete

#### 3. Inventory/Warehouse
- Search: "Inventory" or "stock"
- Click "Activate" button
- Wait for installation to complete

#### 4. Accounting
- Search: "Accounting" or "account"
- Click "Activate" button
- Wait for installation to complete

#### 5. CRM
- Search: "CRM" or "crm"
- Click "Activate" button
- Wait for installation to complete

### Step 3: Verify Installation

After activating all modules, run this command to verify:

```bash
cd /home/ja/Documents/addis-crown-v3/production-submodule
ODOO_URL=https://jafiface-addis-crown-erp.hf.space/odoo ODOO_DB=neondb ODOO_USER=admin ODOO_PASSWORD=admin node scripts/test-odoo-connectivity.mjs
```

Expected result: All models should show records (not "Object doesn't exist" errors).

### Step 4: Continue with Session 2

Once modules are activated and verified, I will proceed with:
- Firestore data audit
- Migration script creation
- Data transfer planning

---

**Note:** Module installation may take a few minutes each. Dependencies may install automatically. If any module shows "Upgrade" instead of "Activate", skip it for now - we can build custom functionality on Neon DB later.
