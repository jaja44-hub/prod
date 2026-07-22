#!/bin/bash
export NEON_ANALYTICS_DB_URL="postgresql://neondb_owner:npg_7QnYZpGf6PAo@ep-silent-breeze-auk7is8u.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
node scripts/seed-analytics-data.mjs
