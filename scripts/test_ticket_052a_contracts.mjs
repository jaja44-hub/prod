import { validateOdooResponse, validateFirestoreDocument, sanitizePayload, buildContractValidator } from '../api/connectors/contracts.js';

(async () => {
  try {
    const odooValid = validateOdooResponse({ jsonrpc: '2.0', id: 1, result: { id: 5, name: 'Test Product' } });
    if (!odooValid.valid || odooValid.data.id !== 5) {
      throw new Error('Odoo response validation failed');
    }

    const odooInvalid = validateOdooResponse({ jsonrpc: '1.0', result: {} });
    if (odooInvalid.valid || odooInvalid.errors.length === 0) {
      throw new Error('Odoo invalid response should fail validation');
    }

    const docValid = validateFirestoreDocument({ id: 'doc-123', name: 'Test' });
    if (!docValid.valid || docValid.data.id !== 'doc-123') {
      throw new Error('Firestore document validation failed');
    }

    const docInvalid = validateFirestoreDocument({});
    if (docInvalid.valid || docInvalid.errors.length === 0) {
      throw new Error('Firestore invalid doc should fail validation');
    }

    const sanitized = sanitizePayload(
      { name: 'Test', count: '123', active: 'true', extra: 'ignored' },
      { name: 'string', count: 'number', active: 'boolean' }
    );
    if (sanitized.name !== 'Test' || sanitized.count !== 123 || sanitized.active !== true || sanitized.extra !== undefined) {
      throw new Error('Payload sanitization failed');
    }

    const validator = buildContractValidator({
      email: { type: 'string', required: true, minLength: 5 },
      age: { type: 'number', required: false },
      status: { type: 'string', maxLength: 50 },
    });

    const validPayload = validator.validate({ email: 'test@example.com', age: 30, status: 'active' });
    if (!validPayload.valid) {
      throw new Error('Valid payload failed validation');
    }

    const invalidPayload = validator.validate({ email: 'abc', status: 'a'.repeat(60) });
    if (invalidPayload.valid || invalidPayload.errors.length === 0) {
      throw new Error('Invalid payload should fail validation');
    }

    console.log('TICKET-052a Contract enforcement tests passed');
    process.exit(0);
  } catch (err) {
    console.error('TICKET-052a tests failed', err);
    process.exit(2);
  }
})();
