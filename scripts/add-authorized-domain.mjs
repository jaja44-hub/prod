#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import {GoogleAuth} from 'google-auth-library';

async function main() {
  const domain = process.argv[2];
  if (!domain) {
    console.error('Usage: node add-authorized-domain.mjs <domain>');
    process.exit(1);
  }

  const saPath = path.resolve(process.cwd(), 'service-account.json');
  if (!fs.existsSync(saPath)) {
    console.error('service-account.json not found in repo root. Place the service account file there.');
    process.exit(1);
  }

  const sa = JSON.parse(fs.readFileSync(saPath, 'utf8'));
  const projectId = sa.project_id;
  if (!projectId) {
    console.error('project_id not found in service-account.json');
    process.exit(1);
  }

  const auth = new GoogleAuth({
    credentials: sa,
    scopes: ['https://www.googleapis.com/auth/identitytoolkit']
  });

  try {
    const client = await auth.getClient();
    const url = `https://identitytoolkit.googleapis.com/admin/v2/projects/${projectId}/config`;

    // Get current config
    const getRes = await client.request({ url });
    const config = getRes.data || {};
    const domains = Array.isArray(config.authorizedDomains) ? config.authorizedDomains.slice() : [];

    if (domains.includes(domain)) {
      console.log(`${domain} is already authorized for project ${projectId}`);
      return;
    }

    domains.push(domain);

    // Patch authorizedDomains field
    const patchRes = await client.request({
      url,
      method: 'PATCH',
      params: { updateMask: 'authorizedDomains' },
      data: { authorizedDomains: domains }
    });

    console.log(`Added ${domain} to authorizedDomains for project ${projectId}`);
    console.log('Response:', patchRes.status, patchRes.statusText);
  } catch (err) {
    console.error('Error updating authorized domains:', err.message || err);
    process.exit(2);
  }
}

main();
