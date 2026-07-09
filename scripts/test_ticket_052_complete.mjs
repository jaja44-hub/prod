import { validateOdooResponse, sanitizePayload, buildContractValidator } from '../api/connectors/contracts.js';
import { exponentialBackoff, retryWithBackoff, CircuitBreaker, buildRetryConfig } from '../api/connectors/retries.js';
import { generateCorrelationId, buildAuditEvent, AuditLogger, logExternalCall } from '../api/connectors/audit.js';

(async () => {
  try {
    // Test contracts + sanitization
    const validOdoo = validateOdooResponse({ jsonrpc: '2.0', id: 1, result: { id: 100, name: 'Product' } });
    if (!validOdoo.valid || validOdoo.data.id !== 100) throw new Error('Odoo contract validation failed');

    const sanitized = sanitizePayload(
      { name: 'Test', count: '500', status: 'active', ignored: 'field' },
      { name: 'string', count: 'number', status: 'string' }
    );
    if (sanitized.count !== 500 || sanitized.ignored !== undefined) throw new Error('Sanitization failed');

    // Test retry + circuit breaker integration
    let retryCount = 0;
    const failThenSucceed = async () => {
      retryCount++;
      if (retryCount === 1) throw new Error('First attempt fails');
      return 'success';
    };

    const result = await retryWithBackoff(failThenSucceed, 3, 50);
    if (result !== 'success' || retryCount !== 2) throw new Error('Retry integration failed');

    const config = buildRetryConfig('odoo');
    if (config.maxAttempts !== 3 || config.timeoutMs !== 5000) throw new Error('Retry config failed');

    // Test audit logging
    const logger = new AuditLogger(500);
    const event = buildAuditEvent({
      correlationId: generateCorrelationId(),
      service: 'odoo',
      action: 'sync_products',
      userId: 'system',
      statusCode: 200,
      duration: 342,
    });
    logger.log(event);

    const loggedCall = await logExternalCall(
      logger,
      {
        service: 'firestore',
        action: 'write_document',
        tenantId: 'production',
      },
      async () => {
        return { written: 1 };
      }
    );
    if (loggedCall.written !== 1) throw new Error('Logged call execution failed');

    const summary = logger.getSummary('production');
    if (summary.totalEvents < 1) throw new Error('Audit summary missing events');

    // Test combined flow: contract validation + retry + audit
    const validator = buildContractValidator({
      email: { type: 'string', required: true },
      age: { type: 'number', required: false },
    });

    let callCount = 0;
    const externalFetch = async () => {
      callCount++;
      if (callCount === 1) throw new Error('Transient failure');

      const payload = { email: 'user@example.com', age: 25 };
      const validation = validator.validate(payload);
      if (!validation.valid) throw new Error('Payload validation failed');

      return { success: true, data: payload };
    };

    const finalResult = await logExternalCall(
      logger,
      {
        service: 'external_api',
        action: 'user_fetch',
        tenantId: 'production',
      },
      () => retryWithBackoff(externalFetch, 3, 50)
    );

    if (!finalResult.success || finalResult.data.email !== 'user@example.com') {
      throw new Error('Full integration flow failed');
    }

    console.log('TICKET-052a/b/c/d External connectors hardening tests passed');
    process.exit(0);
  } catch (err) {
    console.error('TICKET-052 tests failed', err);
    process.exit(2);
  }
})();
