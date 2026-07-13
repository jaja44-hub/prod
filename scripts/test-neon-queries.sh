#!/bin/bash
export NEON_DATABASE_URL="postgresql://neondb_owner:npg_3ILp5RwOHjor@ep-patient-fog-at5jnnt6-pooler.c-9.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require"
node scripts/test-neon-queries.mjs
