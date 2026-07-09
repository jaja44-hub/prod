/**
 * api/middleware/csrf.js
 * CSRF token generation and validation
 */

import { randomBytes } from 'crypto';

const csrfTokens = new Map();
const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

export function generateCSRFToken() {
  const token = randomBytes(32).toString('hex');
  const expiresAt = Date.now() + TOKEN_EXPIRY_MS;

  csrfTokens.set(token, {
    createdAt: Date.now(),
    expiresAt,
    used: false,
  });

  // Cleanup expired tokens
  for (const [key, value] of csrfTokens.entries()) {
    if (value.expiresAt < Date.now()) {
      csrfTokens.delete(key);
    }
  }

  return token;
}

export function validateCSRFToken(token) {
  if (!csrfTokens.has(token)) {
    return { valid: false, reason: 'Token not found' };
  }

  const tokenData = csrfTokens.get(token);

  if (tokenData.expiresAt < Date.now()) {
    csrfTokens.delete(token);
    return { valid: false, reason: 'Token expired' };
  }

  if (tokenData.used) {
    csrfTokens.delete(token);
    return { valid: false, reason: 'Token already used' };
  }

  return { valid: true };
}

export function consumeCSRFToken(token) {
  if (csrfTokens.has(token)) {
    const tokenData = csrfTokens.get(token);
    tokenData.used = true;
    csrfTokens.set(token, tokenData);
  }
}

export function verifyCSRFRequest(req) {
  const token = req.headers['x-csrf-token'] || req.body?.csrfToken;

  if (!token) {
    return { valid: false, reason: 'CSRF token missing' };
  }

  return validateCSRFToken(token);
}
