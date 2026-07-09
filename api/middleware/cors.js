/**
 * api/middleware/cors.js
 * CORS configuration with security hardening
 */

export function corsMiddleware(req, res) {
  const allowedOrigins = [
    'https://addis-crown.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173',
  ];

  const origin = req.headers.origin || '';
  const corsEnabled = allowedOrigins.includes(origin);

  if (corsEnabled) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  // Restrict methods to GET, POST, PUT, DELETE, PATCH
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');

  // Restrict headers
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Correlation-ID, X-Tenant-ID, X-CSRF-Token');

  // Do not expose sensitive headers
  res.setHeader('Access-Control-Expose-Headers', 'X-Correlation-ID');

  // Credentials only for same-origin
  if (corsEnabled) {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  // Cache CORS preflight for 24 hours
  res.setHeader('Access-Control-Max-Age', '86400');

  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  return corsEnabled;
}

export function verifyCORSRequest(req) {
  const allowedOrigins = [
    'https://addis-crown.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173',
  ];

  const origin = req.headers.origin || '';
  return allowedOrigins.includes(origin);
}
