/**
 * api/client.js
 * Unified API client wrapper for React components.
 * Handles auth, retries, error handling, and correlation IDs.
 */

import { retryWithBackoff, CircuitBreaker, executeWithTimeout, buildRetryConfig } from './connectors/retries.js';
import { generateCorrelationId, AuditLogger } from './connectors/audit.js';

export class ApiClient {
  constructor({
    baseUrl = 'http://localhost:3000',
    authToken = null,
    tenantId = 'production',
    retryConfig = {},
    timeoutMs = 5000,
  } = {}) {
    this.baseUrl = baseUrl;
    this.authToken = authToken;
    this.tenantId = tenantId;
    this.retryConfig = { maxAttempts: 3, baseDelayMs: 100, ...retryConfig };
    this.timeoutMs = timeoutMs;
    this.circuitBreakers = {};
    this.auditLogger = new AuditLogger(500);
  }

  setAuthToken(token) {
    this.authToken = token;
  }

  setTenantId(tenantId) {
    this.tenantId = tenantId;
  }

  getCircuitBreaker(service) {
    if (!this.circuitBreakers[service]) {
      this.circuitBreakers[service] = new CircuitBreaker(5, 60000);
    }
    return this.circuitBreakers[service];
  }

  buildHeaders(customHeaders = {}) {
    const headers = {
      'Content-Type': 'application/json',
      'X-Correlation-ID': generateCorrelationId(),
      'X-Tenant-ID': this.tenantId,
      ...customHeaders,
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    return headers;
  }

  async request(endpoint, options = {}) {
    const {
      method = 'GET',
      body = null,
      service = 'api',
      customRetry = null,
      customTimeout = null,
    } = options;

    const url = `${this.baseUrl}${endpoint}`;
    const headers = this.buildHeaders(options.headers);
    const timeout = customTimeout || this.timeoutMs;
    const retry = customRetry || this.retryConfig;

    const breaker = this.getCircuitBreaker(service);

    const makeRequest = async () => {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : null,
      });

      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
        error.statusCode = response.status;
        throw error;
      }

      return response.json();
    };

    try {
      return await breaker.execute(async () => {
        return await retryWithBackoff(
          () => executeWithTimeout(makeRequest(), timeout),
          retry.maxAttempts,
          retry.baseDelayMs,
          (error) => error.statusCode >= 500 || error.message.includes('timeout')
        );
      });
    } catch (error) {
      this.auditLogger.log({
        timestamp: new Date().toISOString(),
        endpoint,
        method,
        service,
        error: { message: error.message, statusCode: error.statusCode },
        success: false,
      });
      throw error;
    }
  }

  async get(endpoint, options = {}) {
    return this.request(endpoint, { method: 'GET', ...options });
  }

  async post(endpoint, body, options = {}) {
    return this.request(endpoint, { method: 'POST', body, ...options });
  }

  async finance(action, payload = null) {
    if (action === 'aging') {
      return this.get('/api/finance/aging', { service: 'finance' });
    } else if (action === 'reconciliation') {
      return this.post('/api/finance/reconciliation', payload, { service: 'finance' });
    }
    throw new Error(`Unknown finance action: ${action}`);
  }

  async crm(action, payload = null) {
    if (action === 'pipeline') {
      return this.get('/api/crm/pipeline', { service: 'crm' });
    } else if (action === 'create_lead') {
      return this.post('/api/crm/pipeline', payload, { service: 'crm' });
    } else if (action === 'activity') {
      return this.get('/api/crm/activity', { service: 'crm' });
    } else if (action === 'log_activity') {
      return this.post('/api/crm/activity', payload, { service: 'crm' });
    }
    throw new Error(`Unknown CRM action: ${action}`);
  }

  async warehouse(action, payload = null) {
    if (action === 'workflow') {
      return this.get('/api/inventory/warehouse', { service: 'warehouse' });
    } else if (action === 'ship') {
      return this.post('/api/inventory/warehouse', payload, { service: 'warehouse' });
    }
    throw new Error(`Unknown warehouse action: ${action}`);
  }

  async analytics(action, payload = null) {
    if (action === 'metrics') {
      return this.get('/api/analytics/metrics', { service: 'analytics' });
    } else if (action === 'dashboard') {
      return this.post('/api/analytics/metrics', payload, { service: 'analytics' });
    } else if (action === 'decisions') {
      return this.get('/api/analytics/decisions', { service: 'analytics' });
    } else if (action === 'budget_analysis') {
      return this.post('/api/analytics/decisions', { type: 'budget_analysis', payload }, { service: 'analytics' });
    }
    throw new Error(`Unknown analytics action: ${action}`);
  }

  getAuditSummary() {
    return this.auditLogger.getSummary(this.tenantId);
  }
}

// Singleton instance for use in React components
let globalClient = null;

export function initApiClient(config = {}) {
  globalClient = new ApiClient(config);
  return globalClient;
}

export function getApiClient() {
  if (!globalClient) {
    globalClient = new ApiClient();
  }
  return globalClient;
}
