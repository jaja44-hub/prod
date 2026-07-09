/**
 * api/connectors/audit.js
 * Structured logging and audit trail generation for external connector calls.
 */

export function generateCorrelationId() {
  return `${Date.now()}-${Math.random().toString(36).substring(7)}`;
}

export function buildAuditEvent({
  correlationId,
  eventType = 'api_call',
  service = 'external',
  action = 'request',
  userId = 'anonymous',
  tenantId = 'production',
  requestPath = '',
  requestMethod = 'GET',
  statusCode = null,
  duration = 0,
  error = null,
  metadata = {},
} = {}) {
  return {
    timestamp: new Date().toISOString(),
    correlationId,
    eventType,
    service,
    action,
    userId,
    tenantId,
    request: {
      path: requestPath,
      method: requestMethod,
    },
    response: {
      statusCode,
    },
    duration,
    error: error ? { message: error.message, code: error.code } : null,
    metadata,
  };
}

export class AuditLogger {
  constructor(maxEvents = 1000) {
    this.events = [];
    this.maxEvents = maxEvents;
  }

  log(event) {
    if (this.events.length >= this.maxEvents) {
      this.events.shift();
    }
    this.events.push(event);
  }

  getEvents(filter = {}) {
    let result = [...this.events];

    if (filter.tenantId) {
      result = result.filter((e) => e.tenantId === filter.tenantId);
    }
    if (filter.service) {
      result = result.filter((e) => e.service === filter.service);
    }
    if (filter.startTime) {
      const startTs = new Date(filter.startTime).getTime();
      result = result.filter((e) => new Date(e.timestamp).getTime() >= startTs);
    }

    return result;
  }

  getSummary(tenantId = 'production') {
    const events = this.getEvents({ tenantId });
    const byService = {};
    const byStatus = { success: 0, error: 0 };

    for (const event of events) {
      byService[event.service] = (byService[event.service] || 0) + 1;
      if (event.error) {
        byStatus.error++;
      } else {
        byStatus.success++;
      }
    }

    return {
      totalEvents: events.length,
      byService,
      byStatus,
      avgDuration: events.reduce((sum, e) => sum + (e.duration || 0), 0) / Math.max(1, events.length),
    };
  }

  clear() {
    this.events = [];
  }
}

export async function logExternalCall(logger, config, fn) {
  const correlationId = generateCorrelationId();
  const startTime = Date.now();

  try {
    const result = await fn();
    const duration = Date.now() - startTime;

    const event = buildAuditEvent({
      ...config,
      correlationId,
      duration,
      statusCode: 200,
    });

    logger.log(event);
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;

    const event = buildAuditEvent({
      ...config,
      correlationId,
      duration,
      statusCode: error.statusCode || 500,
      error,
    });

    logger.log(event);
    throw error;
  }
}
