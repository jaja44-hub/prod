/**
 * setup-firebase-auth-users.mjs
 * Create demo users in Firebase Auth for testing
 * Run: node setup-firebase-auth-users.mjs
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SA_PATH = resolve(__dirname, 'service-account.json');

if (!existsSync(SA_PATH)) {
  console.error('❌ service-account.json not found');
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(SA_PATH, 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const auth = getAuth();

// Demo users from our Firestore seed - match these UIDs
const demoUsers = [
  {
    uid: '7gs2x0Gkn2WPl0vpGGDgYk35tIv1',
    email: 'ceo@addiscrown.et',
    password: 'Passwrd123!',
    displayName: 'CEO Demo User',
    customClaims: { tier: 1, tenantId: 'production', role: 'admin' },
  },
  {
    uid: '3xtt12ZFDbgBbJSIyjuUZchz7vA2',
    email: 'demo_manager@addiscrown.et',
    password: 'Passwrd123!',
    displayName: 'Manager Demo User',
    customClaims: { tier: 2, tenantId: 'default', role: 'manager' },
  },
  {
    uid: '2xf1SXdf1RS6OVvuE06AkwsGzWX2',
    email: 'sales@addiscrown.et',
    password: 'Passwrd123!',
    displayName: 'Sales Staff User',
    customClaims: { tier: 3, tenantId: 'production', role: 'staff' },
  },
];

async function setupUsers() {
  console.log('\n' + '═'.repeat(80));
  console.log('🔐 FIREBASE AUTH SETUP');
  console.log(`   Project: ${serviceAccount.project_id}`);
  console.log('═'.repeat(80) + '\n');

  for (const userConfig of demoUsers) {
    try {
      console.log(`📝 Processing ${userConfig.email}...`);
      
      // Check if user exists
      let user;
      try {
        user = await auth.getUser(userConfig.uid);
        console.log(`  ℹ️  User exists (uid: ${userConfig.uid})`);
      } catch (err) {
        if (err.code !== 'auth/user-not-found') throw err;
        
        // Create user
        user = await auth.createUser({
          uid: userConfig.uid,
          email: userConfig.email,
          password: userConfig.password,
          displayName: userConfig.displayName,
          emailVerified: true,
        });
        console.log(`  ✅ Created user (uid: ${userConfig.uid})`);
      }

      // Set custom claims
      await auth.setCustomUserClaims(userConfig.uid, userConfig.customClaims);
      console.log(`  ✅ Custom claims set: tier=${userConfig.customClaims.tier}, tenantId=${userConfig.customClaims.tenantId}`);

    } catch (err) {
      console.error(`  ❌ Error: ${err.message}`);
    }
  }

  console.log('\n' + '═'.repeat(80));
  console.log('✅ FIREBASE AUTH SETUP COMPLETE');
  console.log('═'.repeat(80) + '\n');
  console.log('Demo Login Credentials:');
  console.log('');
  console.log('  🔑 CEO Access:');
  console.log('     Email:    ceo@addiscrown.et');
  console.log('     Password: Passwrd123!');
  console.log('     Tier:     1 (Full Access)');
  console.log('     Tenant:   production');
  console.log('');
  console.log('  🔑 Manager Access:');
  console.log('     Email:    demo_manager@addiscrown.et');
  console.log('     Password: Passwrd123!');
  console.log('     Tier:     2 (Limited Access)');
  console.log('     Tenant:   default');
  console.log('');
  console.log('  🔑 Staff Access:');
  console.log('     Email:    sales@addiscrown.et');
  console.log('     Password: Passwrd123!');
  console.log('     Tier:     3 (Minimal Access)');
  console.log('     Tenant:   production');
  console.log('\n');

  process.exit(0);
}

setupUsers().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
