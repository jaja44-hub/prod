import handler from './api/inventory.js';

const req = {
  method: 'GET',
  query: { path: 'products', tenant_id: 'tenant_default' },
  headers: {}
};

const res = {
  setHeader: () => {},
  status: (code) => {
    console.log('Status:', code);
    return res;
  },
  json: (data) => {
    console.log('JSON:', data);
  },
  end: () => console.log('End')
};

handler(req, res).catch(console.error);
