#!/bin/bash
export ODOO_URL="https://jafiface-addis-crown-erp.hf.space/odoo"
export ODOO_DB="neondb"
export ODOO_USER="admin"
export ODOO_PASSWORD="admin"
node scripts/fix-odoo-data-quality.mjs
