#!/bin/bash
export NEON_ACCOUNTING_DB_URL="postgresql://neondb_owner:npg_sUbwp0cAWdH3@ep-solitary-dew-auii1z3j.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
node scripts/seed-sales-hr-crm-data.mjs
