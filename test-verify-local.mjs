import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import fs from 'fs';
import fetch from 'node-fetch';

// Load service account (same as server would)
const sa = JSON.parse(fs.readFileSync('service-account.json', 'utf8'));
initializeApp({ credential: cert(sa) });
const auth = getAuth();

// CEO user UID
const uid = 'JGXG6BzoQxXAg4hEGJ6XeN6OWts2';

// Create custom token + exchange for ID token
const customToken = await auth.createCustomToken(uid, { role: 'ceo', tenantId: 'production', tier: 1 });
const apiKey = 'AIzaSyBbEP11mDK-ZCDY52DRSnjMJOGuR9ybozs';
const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`;
const resp = await fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ token: customToken, returnSecureToken: true })
});
const data = await resp.json();
console.log('Got ID token:', Boolean(data.idToken));
if (!data.idToken) { console.log(JSON.stringify(data)); process.exit(1); }

// Now SIMULATE the server verifyBearerToken path:
// 1. Verify the ID token with Admin SDK
try {
  const decoded = await auth.verifyIdToken(data.idToken);
  console.log('verifyIdToken SUCCESS:', JSON.stringify({ uid: decoded.uid, email: decoded.email, tenantId: decoded.tenantId, role: decoded.role, tier: decoded.tier }));
  
  // 2. Simulate enrichDecodedToken (fetch Firestore users doc)
  try {
    const db = (await import('firebase-admin/firestore')).getFirestore();
    const userSnap = await db.collection('users').doc(decoded.uid).get();
    console.log('Firestore users doc exists:', userSnap.exists);
    if (userSnap.exists) {
      const profile = userSnap.data();
      console.log('Profile from Firestore:', JSON.stringify({ role: profile.role, tenantId: profile.tenantId, tier: profile.tier, enabledModules: profile.enabledModules }));
    } else {
      console.log('WARNING: users doc NOT found in Firestore for uid', uid);
    }
  } catch (e) {
    console.log('Firestore read error:', e.message);
  }
} catch (e) {
  console.log('verifyIdToken FAILED:', e.code || e.message);
  console.log('FULL ERROR:', JSON.stringify(e, null, 2));
}
