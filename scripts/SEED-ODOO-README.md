# Seed Odoo Demo Data

This repository includes a secure, environment-driven seeder for Odoo demo data.

## Runner Steps

1. Change into the production repo:

```bash
cd /home/ja/Documents/addis-crown-v3/production-submodule
```

2. Export the required Odoo environment variables:

```bash
export ODOO_URL="https://..."
export ODOO_DB="..."
export ODOO_USER="..."
export ODOO_APIKEY="..."
```

3. Run the seed script:

```bash
npm run seed:odoo
```

## Notes

- The seeder uses environment variables only.
- Do not commit `.env` or any secret values.
- Run this when the Odoo instance is awake; cold starts may take 1–2 minutes.
