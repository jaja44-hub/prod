import xmlrpc from 'xmlrpc';

const ODOO_URL = 'https://jafiface-addis-crown-erp.hf.space';
const ODOO_DB = 'POSTGRES_DATABASE=neondb';
const ODOO_USER = 'admin';
const ODOO_APIKEY = '6c034bd45544684399d58e003b41f70c95a04fe5';

const commonClient = xmlrpc.createSecureClient({ url: `${ODOO_URL}/xmlrpc/2/common` });
const objectClient = xmlrpc.createSecureClient({ url: `${ODOO_URL}/xmlrpc/2/object` });

commonClient.methodCall('authenticate', [ODOO_DB, ODOO_USER, ODOO_APIKEY, {}], (err, uid) => {
  if (err || !uid) return console.error('Auth failed');
  
  console.log('Authenticated! Finding modules to install...');
  
  const modulesToInstall = ['sale_management', 'purchase', 'mrp', 'hr', 'account', 'stock', 'crm'];
  
  objectClient.methodCall('execute_kw', [ODOO_DB, uid, ODOO_APIKEY, 'ir.module.module', 'search', [[['name', 'in', modulesToInstall]]]], (err, moduleIds) => {
    if (err) return console.error('Search Error:', err);
    console.log(`Found ${moduleIds.length} modules. Initiating installation... this may take 1-2 minutes.`);
    
    objectClient.methodCall('execute_kw', [ODOO_DB, uid, ODOO_APIKEY, 'ir.module.module', 'button_immediate_install', [moduleIds]], (err2, result) => {
      if (err2) return console.error('Installation Error:', err2);
      console.log('Installation Triggered:', result);
      process.exit(0);
    });
  });
});
