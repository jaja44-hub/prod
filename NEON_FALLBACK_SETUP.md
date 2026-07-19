# Neon Fallback Setup

1. Go to https://console.neon.tech
2. Click "New Project" (top-right)
3. Name: `production-submodule-fallback`
4. Select same region and PostgreSQL version as primary
5. Click "Create Project"
6. On new project, click "Connect" button
7. **DISABLE Connection Pooling toggle** (critical!)
8. Copy connection string
9. Go to primary project, click "Connect"
10. **DISABLE Connection Pooling**
11. Copy primary connection string
12. Save both to `/home/ja/Documents/production-submodule/neon-credentials.txt`
13. Install: `sudo apt-get install postgresql-client`
14. Migrate: `pg_dump -Fc -v -d "PRIMARY" | pg_restore -v -d "FALLBACK"`
15. Update .env DATABASE_URL with fallback string
16. Update Vercel env var with fallback string





postgresql://neondb_owner:npg_Damo1yxYQ2GI@ep-tiny-bread-avliuv4n.c-11.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require





postgresql://neondb_owner:npg_3ILp5RwOHjor@ep-patient-fog-at5jnnt6.c-9.us-east-1.aws.neon.tech/neon?sslmode=require&channel_binding=require