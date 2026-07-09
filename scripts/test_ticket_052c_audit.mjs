import { generateCorrelationId, buildAuditEvent, AuditLogger, logExternalCall } from '../api/connectors/audit.js';

(async () => {
  try {
    const corrId = generateCorrelationId();
    if (!corrId || corrId.split('-').length !== 2) throw new Error('Correlation ID format invalid');

    const event = buildAuditEvent({
      correlationId: corrId,
      service: 'odoo',
      action: 'fetch_products',
      userId: 'admin',
      tenantId: 'production',
      statusCode: 200,
      duration: 245,
    });

    if (event.correlationId !== corrId || event.service !== 'odoo' || event.duration !== 245) {
      throw new Error('Audit event construction failed');
    }

    const logger = new AuditLogger(100);
    logger.log(event);

    const event2 = buildAuditEvent({
      correlationId: generateCorrelationId(),
      service: 'firestore',
      statusCode: 200,
      duration: 120,
      tenantId: 'production',
    });
    logger.log(event2);

    const events = logger.getEvents({ tenantId: 'production' });
    if (events.length !== 2) throw new Error('Audit retrieval failed');

    const summary = logger.getSummary('production');
    if (summary.totalEvents !== 2 || summary.byStatus.success !== 2) {
      throw new Error('Audit summary calculation failed');
    }

    const errorEvent = buildAuditEvent({
      correlationId: generateCorrelationId(),
      service: 'odoo',
      statusCode: 500,
      duration: 5000,
      error: new Error('Connection timeout'),
    });
    logger.log(errorEvent);

    const errorSummary = logger.getSummary();
    if (errorSummary.byStatus.error !== 1) throw new Error('Error counting failed');

    const loggedResult = await logExternalCall(
      logger,
      {
        service: 'github',
        action: 'fetch_repo',
        tenantId: 'production',
      },
      async () => {
        return { repos: ['prod', 'dev'] };
      }
    );

    if (loggedResult.repos.length !== 2) throw new Error('Logged call result mismatch');

    console.log('TICKET-052c Audit & logging tests passed');
    process.exit(0);
  } catch (err) {
    console.error('TICKET-052c tests failed', err);
    process.exit(2);
  }
})();
