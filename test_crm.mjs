import handler from './server/api/crm/activity.js';

const req = { method: 'GET', headers: {} };
const res = {
  setHeader: () => {},
  status: (code) => ({
    json: (data) => console.log('STATUS:', code, data),
    end: () => console.log('END:', code)
  })
};

handler(req, res).then(() => console.log('Done')).catch(console.error);
