import xmlrpc from 'xmlrpc';

const url = 'https://jafiface-addis-crown-erp.hf.space';

function testConnection(db, user, password) {
  return new Promise((resolve, reject) => {
    const client = xmlrpc.createSecureClient({ url: url + '/xmlrpc/2/common' });
    client.methodCall('authenticate', [db, user, password, {}], (err, uid) => {
      if (err) return resolve({ success: false, error: err });
      if (uid) return resolve({ success: true, uid, db, user });
      resolve({ success: false, error: 'Access Denied (False returned)' });
    });
  });
}

async function run() {
  const combinations = [
    { db: 'neondb', user: 'admin', pass: '6c034bd45544684399d58e003b41f70c95a04fe5' },
    { db: 'neondb', user: 'admin@addiscrown.com', pass: '6c034bd45544684399d58e003b41f70c95a04fe5' },
    { db: 'POSTGRES_DATABASE=neondb', user: 'admin', pass: '6c034bd45544684399d58e003b41f70c95a04fe5' },
    { db: 'POSTGRES_DATABASE=neondb', user: 'admin@addiscrown.com', pass: '6c034bd45544684399d58e003b41f70c95a04fe5' },
    { db: 'neondb', user: 'admin', pass: '2f2d63197d9515f1127cb04d8737a47ab84c9192' },
    { db: 'neondb', user: 'admin@addiscrown.com', pass: '2f2d63197d9515f1127cb04d8737a47ab84c9192' }
  ];

  for (const c of combinations) {
    console.log(`Testing: db=${c.db}, user=${c.user}`);
    const res = await testConnection(c.db, c.user, c.pass);
    if (res.success) {
      console.log('✅ SUCCESS! UID:', res.uid);
      process.exit(0);
    } else {
      console.log('❌ FAILED');
    }
  }
  console.log('All failed.');
}

run();
