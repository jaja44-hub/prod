/**
 * api/connectors/contracts.js
 * Contract validation and enforcement for external API payloads.
 */

export function validateOdooResponse(payload = {}) {
  if (!payload || typeof payload !== 'object') {
    return { valid: false, errors: ['Payload must be an object'] };
  }

  const errors = [];

  if (payload.jsonrpc && payload.jsonrpc !== '2.0') {
    errors.push(`Invalid jsonrpc version: ${payload.jsonrpc}`);
  }

  if (!payload.hasOwnProperty('id')) {
    errors.push('Missing id field');
  }

  if (payload.error) {
    errors.push(`RPC Error: ${JSON.stringify(payload.error)}`);
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : [],
    data: payload.result || null,
  };
}

export function validateFirestoreDocument(doc = {}) {
  if (!doc || typeof doc !== 'object') {
    return { valid: false, errors: ['Document must be an object'] };
  }

  const errors = [];

  if (!doc.id || typeof doc.id !== 'string') {
    errors.push('Missing or invalid id field');
  }

  if (doc._writeTime === undefined || doc._createTime === undefined) {
    // Firestore metadata, optional but helpful
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : [],
    data: doc,
  };
}

export function sanitizePayload(payload = {}, schema = {}) {
  const sanitized = {};
  const allowedKeys = Object.keys(schema);

  for (const key of allowedKeys) {
    if (key in payload) {
      const expectedType = schema[key];
      let value = payload[key];

      if (expectedType === 'string' && typeof value !== 'string') {
        value = String(value);
      } else if (expectedType === 'number' && typeof value !== 'number') {
        value = Number(value);
      } else if (expectedType === 'boolean' && typeof value !== 'boolean') {
        value = Boolean(value);
      }

      sanitized[key] = value;
    }
  }

  return sanitized;
}

export function buildContractValidator(contractSpec = {}) {
  return {
    validate(payload) {
      const errors = [];

      for (const [field, rules] of Object.entries(contractSpec)) {
        if (rules.required && !(field in payload)) {
          errors.push(`Missing required field: ${field}`);
          continue;
        }

        if (field in payload) {
          const value = payload[field];
          if (rules.type && typeof value !== rules.type) {
            errors.push(`Field '${field}' has wrong type: expected ${rules.type}, got ${typeof value}`);
          }
          if (rules.minLength && String(value).length < rules.minLength) {
            errors.push(`Field '${field}' is too short: minimum ${rules.minLength} chars`);
          }
          if (rules.maxLength && String(value).length > rules.maxLength) {
            errors.push(`Field '${field}' is too long: maximum ${rules.maxLength} chars`);
          }
        }
      }

      return {
        valid: errors.length === 0,
        errors,
      };
    },
  };
}
