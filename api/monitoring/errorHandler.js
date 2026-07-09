/**
 * api/monitoring/errorHandler.js
 * Centralized error tracking and observability
 */

const errorLog = [];
const MAX_ERRORS = 1000;

export class ErrorTracker {
  constructor(serviceName = 'api') {
    this.serviceName = serviceName;
    this.startTime = Date.now();
  }

  trackError(error, context = {}) {
    const errorEntry = {
      timestamp: new Date().toISOString(),
      service: this.serviceName,
      message: error.message,
      stack: error.stack,
      statusCode: error.statusCode || 500,
      context,
      correlationId: context.correlationId || 'unknown',
    };

    errorLog.push(errorEntry);

    // Keep only last 1000 errors
    if (errorLog.length > MAX_ERRORS) {
      errorLog.shift();
    }

    return errorEntry;
  }

  getErrorSummary() {
    const errorsByCode = {};
    const errorsByService = {};
    const recentErrors = errorLog.slice(-50);

    errorLog.forEach((error) => {
      errorsByCode[error.statusCode] = (errorsByCode[error.statusCode] || 0) + 1;
      errorsByService[error.service] = (errorsByService[error.service] || 0) + 1;
    });

    return {
      totalErrors: errorLog.length,
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      errorsByCode,
      errorsByService,
      recentErrors,
      errorRate: ((errorLog.length / (Math.floor((Date.now() - this.startTime) / 1000) / 3600)) || 0).toFixed(2),
    };
  }

  getErrors(limit = 50) {
    return errorLog.slice(-limit);
  }

  clearErrors() {
    errorLog.length = 0;
  }
}

export const globalErrorTracker = new ErrorTracker('production-erp');
