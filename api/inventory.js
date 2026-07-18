/**
 * api/inventory.js
 * Vercel serverless wrapper for inventory Express router
 */

import inventoryRouter from '../server/api/inventory/router.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Content-Type, Authorization, X-Correlation-ID, X-Tenant-ID');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const expressReq = {
    method: req.method,
    url: req.url,
    query: new URLSearchParams(req.url.split('?')[1] || ''),
    params: {},
    body: req.body,
    headers: req.headers
  };

  const queryObj = {};
  expressReq.query.forEach((value, key) => {
    queryObj[key] = value;
  });
  expressReq.query = queryObj;

  const expressRes = {
    status: (code) => {
      res.statusCode = code;
      return expressRes;
    },
    json: (data) => {
      res.setHeader('Content-Type', 'application/json');
      res.status(res.statusCode || 200).json(data);
    },
    end: () => {
      res.status(res.statusCode || 200).end();
    }
  };

  try {
    await inventoryRouter(expressReq, expressRes);
  } catch (error) {
    console.error('Inventory API error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}
