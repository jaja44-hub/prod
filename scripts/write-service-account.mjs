import { writeFileSync } from 'fs';

/*
  Writes `service-account.json` from the environment variable
  `FIREBASE_SERVICE_ACCOUNT` at build/runtime.

  Expected formats:
  - Raw JSON string
  - Base64-encoded JSON string

  Usage (in Vercel): set `FIREBASE_SERVICE_ACCOUNT` to the JSON (or base64) in project envs,
  and add `npm run vercel-build` as the Vercel Build Command or pre-build step.
*/

const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!raw) {
  console.log('FIREBASE_SERVICE_ACCOUNT not set — skipping service-account write');
  process.exit(0);
}

function tryParseJson(s) {
  try { return JSON.parse(s); } catch (e) { return null; }
}

let jsonText = null;
if (tryParseJson(raw)) {
  jsonText = raw;
} else {
  // try base64 decode
  try {
    const dec = Buffer.from(raw, 'base64').toString('utf8');
    if (tryParseJson(dec)) jsonText = dec;
  } catch (e) {
    // ignore
  }
}

if (!jsonText) {
  console.error('FIREBASE_SERVICE_ACCOUNT invalid: not JSON or base64-encoded JSON');
  process.exit(1);
}

writeFileSync('service-account.json', jsonText, { encoding: 'utf8', mode: 0o600 });
console.log('Wrote service-account.json from FIREBASE_SERVICE_ACCOUNT');
