/**
 * server/api/lib/connectors/audit.js
 * Audit logging, correlation IDs, and request tracking.
 */

export function generateCorrelationId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export class AuditLogger {
  constructor(maxEntries = 1000) {
    this.maxEntries = maxEntries;
    this.entries = [];
  }

  log(entry) {
    this.entries.push({
      ...entry,
      id: generateCorrelationId(),
      timestamp: new Date().toISOString(),
    });

    if (this.entries.length > this.maxEntries) {
      this.entries.shift();
    }
  }

  getSummary(tenantId) {
    return {
      tenantId,
      totalEntries: this.entries.length,
      errorRate: this.getErrorRate(),
      lastEntries: this.entries.slice(-10),
    };
  }

  getErrorRate() {
    if (this.entries.length === 0) return 0;
    const errors = this.entries.filter((e) => e.success === false).length;
    return Math.round((errors / this.entries.length) * 100);
  }

  clear() {
    this.entries = [];
  }
}
