import admin from 'firebase-admin';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

let initialized = false;
let warningLogged = false;

function loadServiceAccountFromFile() {
  const candidates = [
    resolve(process.cwd(), 'service-account.json'),
    resolve(process.cwd(), 'api/service-account.json'),
  ];
  for (const filePath of candidates) {
    if (!existsSync(filePath)) continue;
    try {
      return JSON.parse(readFileSync(filePath, 'utf8'));
    } catch {
      // try next path
    }
  }
  return null;
}

function loadServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      try {
        const decoded = Buffer.from(raw, 'base64').toString('utf8');
        return JSON.parse(decoded);
      } catch {
        // fall through to file
      }
    }
  }
  return loadServiceAccountFromFile();
}

export function getFirebaseAdmin() {
  if (!initialized && admin.apps.length === 0) {
    const sa = loadServiceAccount();
    if (!sa) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT not configured');
    }
    admin.initializeApp({ credential: admin.credential.cert(sa) });
    initialized = true;
  }
  return admin;
}

export async function verifyBearerToken(authHeader) {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7).trim();
  if (!token) return null;
  const adminSdk = getFirebaseAdmin();
  return adminSdk.auth().verifyIdToken(token);
}

export function logSkipAuthWarning() {
  if (!warningLogged) {
    console.warn('[Odoo Proxy] ODOO_PROXY_SKIP_AUTH=true, skipping Firebase token verification in dev mode. Do not use in production.');
    warningLogged = true;
  }
}
