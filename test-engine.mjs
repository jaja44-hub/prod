import handler from './server/api/analytics/engine.js';
const req = {
  method: 'GET',
  headers: { 'x-tenant-id': 'production' },
  body: {}
};
const res = {
  setHeader: () => {},
  status: (code) => ({
    json: (data) => {
      console.log('STATUS:', code);
      console.log('JSON:', JSON.stringify(data).substring(0, 200));
    },
    end: () => console.log('END')
  })
};
handler(req, res).catch(console.error);
