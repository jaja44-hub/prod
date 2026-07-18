/**
 * api/purchase.js
 * Vercel serverless wrapper for purchase Express router
 */

import purchaseRouter from '../server/api/purchase/router.js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Content-Type, Authorization, X-Correlation-ID, X-Tenant-ID');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Convert Vercel request to Express-like request
  const expressReq = {
    method: req.method,
    url: req.url,
    query: new URLSearchParams(req.url.split('?')[1] || ''),
    params: {},
    body: req.body,
    headers: req.headers
  };

  // Extract path parameters from URL
  const pathParts = req.url.split('/').filter(Boolean);
  if (pathParts.length >= 3) {
    if (pathParts[2] === 'orders' && pathParts[3] && pathParts[4] === 'from-requisition') {
      expressReq.params = { requisitionId: pathParts[3] };
    } else if (pathParts[2] === 'orders' && pathParts[3]) {
      expressReq.params = { id: pathParts[3] };
    } else if (pathParts[2] === 'requisitions' && pathParts[3]) {
      expressReq.params = { id: pathParts[3] };
    } else if (pathParts[2] === 'suppliers' && pathParts[3] === 'category' && pathParts[4]) {
      expressReq.params = { categoryId: pathParts[4] };
    } else if (pathParts[2] === 'suppliers' && pathParts[3] === 'search' && pathParts[4]) {
      expressReq.params = { term: pathParts[4] };
    } else if (pathParts[2] === 'suppliers' && pathParts[3]) {
      expressReq.params = { id: pathParts[3] };
    } else if (pathParts[2] === 'receipts' && pathParts[3] === 'from-po' && pathParts[4]) {
      expressReq.params = { poId: pathParts[4] };
    } else if (pathParts[2] === 'receipts' && pathParts[3]) {
      expressReq.params = { id: pathParts[3] };
    } else if (pathParts[2] === 'budget' && pathParts[3] === 'category' && pathParts[4]) {
      expressReq.params = { categoryId: pathParts[4] };
    } else if (pathParts[2] === 'budget' && pathParts[3] === 'requisitions' && pathParts[4]) {
      expressReq.params = { id: pathParts[4] };
    } else if (pathParts[2] === 'budget' && pathParts[3] === 'orders' && pathParts[4]) {
      expressReq.params = { id: pathParts[4] };
    } else if (pathParts[2] === 'budget' && pathParts[3] === 'commitments' && pathParts[4]) {
      expressReq.params = { id: pathParts[4] };
    }
  }

  // Convert query string to object
  const queryObj = {};
  expressReq.query.forEach((value, key) => {
    queryObj[key] = value;
  });
  expressReq.query = queryObj;

  // Express-like response object
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
    await purchaseRouter(expressReq, expressRes);
  } catch (error) {
    console.error('Purchase API error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}
