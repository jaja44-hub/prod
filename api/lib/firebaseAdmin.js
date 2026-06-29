import admin from 'firebase-admin';

let initialized = false;
let warningLogged = false;

function loadServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    try {
      const decoded = Buffer.from(raw, 'base64').toString('utf8');
      return JSON.parse(decoded);
    } catch {
      return null;
    }
  }
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
