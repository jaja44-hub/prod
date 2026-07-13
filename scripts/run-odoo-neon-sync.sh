#!/bin/bash
export NEON_DATABASE_URL="postgresql://neondb_owner:npg_3ILp5RwOHjor@ep-patient-fog-at5jnnt6-pooler.c-9.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require"
export ODOO_URL="https://jafiface-addis-crown-erp.hf.space/odoo"
export ODOO_DB="neondb"
export ODOO_USER="admin"
export ODOO_PASSWORD="admin"
node scripts/sync-odoo-to-neon.mjs
