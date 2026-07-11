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
      console.warn('[firebaseAdmin] FIREBASE_SERVICE_ACCOUNT not configured - Firestore operations will fail');
      return null;
    }
    admin.initializeApp({ credential: admin.credential.cert(sa) });
    initialized = true;
  }
  return admin;
}

async function enrichDecodedToken(decoded) {
  if (!decoded?.uid) return decoded;

  let role = decoded.role || null;
  let tenantId = decoded.tenantId || decoded.tenant_id || 'production';
  let tier = decoded.tier ?? 1;

  try {
    const adminSdk = getFirebaseAdmin();
    const db = adminSdk.firestore();
    const userSnap = await db.collection('users').doc(decoded.uid).get();
    if (userSnap.exists) {
      const profile = userSnap.data() || {};
      role = profile.role || role;
      tenantId = profile.tenantId || tenantId;
      tier = profile.tier ?? tier;
    }
  } catch (err) {
    console.warn('[firebaseAdmin] profile enrichment failed:', err?.message || err);
  }

  if (!role || role === 'viewer') {
    role = tenantId === 'production' ? 'ceo' : 'viewer';
  }

  return {
    ...decoded,
    uid: decoded.uid,
    role,
    tenantId,
    tenant_id: tenantId,
    tier,
  };
}

export async function verifyBearerToken(authHeaderOrReq) {
  let authHeader = null;

  if (typeof authHeaderOrReq === 'string') {
    authHeader = authHeaderOrReq;
  } else if (authHeaderOrReq && typeof authHeaderOrReq.headers === 'object') {
    authHeader = authHeaderOrReq.headers.authorization || authHeaderOrReq.headers.Authorization || null;
  } else if (authHeaderOrReq && typeof authHeaderOrReq.authorization === 'string') {
    authHeader = authHeaderOrReq.authorization;
  }

  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7).trim();
  if (!token) return null;
  const adminSdk = getFirebaseAdmin();
  const decoded = await adminSdk.auth().verifyIdToken(token);
  return enrichDecodedToken(decoded);
}

export function logSkipAuthWarning() {
  if (!warningLogged) {
    console.warn('[Odoo Proxy] ODOO_PROXY_SKIP_AUTH=true, skipping Firebase token verification in dev mode. Do not use in production.');
    warningLogged = true;
  }
}
