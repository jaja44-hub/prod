/**
 * api/middleware/security.js
 * Security headers and XSS/injection prevention
 */

export function sanitizeInput(input) {
  if (typeof input !== 'string') return input;

  // Remove null bytes
  let sanitized = input.replace(/\0/g, '');

  // HTML encode potentially dangerous characters
  const htmlEncode = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };

  sanitized = sanitized.replace(/[&<>"']/g, (char) => htmlEncode[char]);

  return sanitized;
}

export function validateSQL(query) {
  // Basic SQL injection detection
  const dangerousPatterns = [
    /(\bUNION\b.*\bSELECT\b)/i,
    /(\bDROP\b|\bDELETE\b|\bTRUNCATE\b)/i,
    /(\bEXEC\b|\bEXECUTE\b)/i,
    /(;.*\b(DROP|DELETE|UPDATE|INSERT)\b)/i,
    /('.*=.*')/,
    /(--|\/\*)/,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(query)) {
      return { valid: false, reason: `Potentially malicious pattern detected: ${pattern}` };
    }
  }

  return { valid: true };
}

export function validateJWT(token) {
  if (!token) return { valid: false, reason: 'Token missing' };

  const parts = token.split('.');
  if (parts.length !== 3) {
    return { valid: false, reason: 'Invalid JWT format' };
  }

  try {
    // Decode header and payload (not verifying signature here - that's done elsewhere)
    const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());

    // Check expiration
    if (payload.exp && payload.exp < Date.now() / 1000) {
      return { valid: false, reason: 'Token expired' };
    }

    // Check required fields
    if (!payload.uid || !payload.tenant_id) {
      return { valid: false, reason: 'Missing required claims' };
    }

    return { valid: true, payload };
  } catch (err) {
    return { valid: false, reason: `Invalid JWT: ${err.message}` };
  }
}

export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};
