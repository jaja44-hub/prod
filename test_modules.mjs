import xmlrpc from 'xmlrpc';

const ODOO_URL = 'https://jafiface-addis-crown-erp.hf.space';
const ODOO_DB = 'POSTGRES_DATABASE=neondb';
const ODOO_USER = 'admin';
const ODOO_APIKEY = '6c034bd45544684399d58e003b41f70c95a04fe5';

const commonClient = xmlrpc.createSecureClient({ url: `${ODOO_URL}/xmlrpc/2/common` });
const objectClient = xmlrpc.createSecureClient({ url: `${ODOO_URL}/xmlrpc/2/object` });

commonClient.methodCall('authenticate', [ODOO_DB, ODOO_USER, ODOO_APIKEY, {}], (err, uid) => {
  if (err || !uid) return console.error('Auth failed');
  
  objectClient.methodCall('execute_kw', [ODOO_DB, uid, ODOO_APIKEY, 'ir.module.module', 'search_read', [[['state', '=', 'installed']]], { fields: ['name'] }], (err, installedModules) => {
    if (err) return console.error('Error:', err);
    console.log('Installed Modules:');
    installedModules.forEach(m => console.log(m.name));
    process.exit(0);
  });
});
