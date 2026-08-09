Production submodule scaffold for Addis Crown — DO NOT COMMIT secrets here.

This repo is intended to be pushed to https://github.com/jaja44-hub/prod and used as the production-only build.

Local secrets (service-account.json) are ignored by .gitignore and must be added to Vercel envs instead of committing.

## TODO
- [ ] Review and update documentation
- [ ] Verify all environment variables are configured in Vercel
- [ ] Run full test suite before deployment
- [ ] Check Firebase security rules
- [ ] Validate API endpoints
