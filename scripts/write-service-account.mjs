import { mkdirSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';

/*
  Writes service account JSON from FIREBASE_SERVICE_ACCOUNT for:
  - local scripts (project root)
  - Vercel serverless api/odooProxy (api/service-account.json)
*/

const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!raw) {
  console.log('FIREBASE_SERVICE_ACCOUNT not set — skipping service-account write');
  process.exit(0);
}

function tryParseJson(s) {
  try { return JSON.parse(s); } catch { return null; }
}

let jsonText = null;
if (tryParseJson(raw)) {
  jsonText = raw;
} else {
  try {
    const dec = Buffer.from(raw, 'base64').toString('utf8');
    if (tryParseJson(dec)) jsonText = dec;
  } catch {
    // ignore
  }
}

if (!jsonText) {
  console.error('FIREBASE_SERVICE_ACCOUNT invalid: not JSON or base64-encoded JSON');
  process.exit(1);
}

const targets = [
  resolve(process.cwd(), 'service-account.json'),
  resolve(process.cwd(), 'api/service-account.json'),
];

for (const target of targets) {
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, jsonText, { encoding: 'utf8', mode: 0o600 });
  console.log(`Wrote ${target}`);
}
