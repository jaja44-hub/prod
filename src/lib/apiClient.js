/**
 * src/lib/apiClient.js
 * Unified API client wrapper for React components.
 * Handles auth, retries, error handling, and correlation IDs.
 */

// Client-side retry utilities (simplified from server version)
function buildRetryConfig(config = {}) {
  return {
    maxAttempts: config.maxAttempts || 3,
    baseDelayMs: config.baseDelayMs || 100,
    maxDelayMs: config.maxDelayMs || 5000,
    ...config
  };
}

async function retryWithBackoff(fn, config = {}) {
  const { maxAttempts = 3, baseDelayMs = 100, maxDelayMs = 5000 } = buildRetryConfig(config);
  let lastError;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt === maxAttempts - 1) throw error;
      
      const delay = Math.min(baseDelayMs * Math.pow(2, attempt), maxDelayMs);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}

class CircuitBreaker {
  constructor(threshold = 5, timeout = 60000) {
    this.threshold = threshold;
    this.timeout = timeout;
    this.failures = 0;
    this.state = 'closed';
    this.nextAttempt = 0;
  }

  async execute(fn) {
    if (this.state === 'open') {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is open');
      }
      this.state = 'half-open';
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.failures = 0;
    this.state = 'closed';
  }

  onFailure() {
    this.failures++;
    if (this.failures >= this.threshold) {
      this.state = 'open';
      this.nextAttempt = Date.now() + this.timeout;
    }
  }
}

async function executeWithTimeout(fn, timeoutMs = 5000) {
  return Promise.race([
    fn(),
    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeoutMs))
  ]);
}

// Client-side correlation ID generator
function generateCorrelationId() {
  return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Client-side audit logger (simplified)
class AuditLogger {
  constructor(maxSize = 500) {
    this.maxSize = maxSize;
    this.logs = [];
  }

  log(event) {
    this.logs.push({
      ...event,
      timestamp: Date.now(),
      correlationId: generateCorrelationId()
    });
    
    if (this.logs.length > this.maxSize) {
      this.logs.shift();
    }
  }

  getLogs() {
    return [...this.logs];
  }
}

function resolveBaseUrl() {
  if (typeof window !== 'undefined' && window.location?.hostname) {
    if (window.location.hostname === 'localhost') {
      return 'http://localhost:3001';
    }
    return window.location.origin;
  }
  return 'http://localhost:3001';
}

export class ApiClient {
  constructor({
    baseUrl = resolveBaseUrl(),
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

      const contentType = response.headers?.get?.('content-type') || '';
      const text = await response.text();

      if (!text) {
        return {};
      }

      if (!contentType.includes('application/json') && !contentType.includes('+json')) {
        const fallback = {
          __rawText: text,
          __parseError: 'HTML or non-JSON response',
        };
        return fallback;
      }

      try {
        return JSON.parse(text);
      } catch (parseError) {
        return {
          __rawText: text,
          __parseError: parseError.message || 'Invalid JSON response',
        };
      }
    };

    try {
      return await breaker.execute(async () => {
        return await retryWithBackoff(
          () => executeWithTimeout(makeRequest(), timeout),
          retry
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
    } else if (action === 'opportunities') {
      return this.get('/api/crm/opportunities', { service: 'crm' });
    }
    throw new Error(`Unknown CRM action: ${action}`);
  }

  async sales(action, payload = null) {
    if (action.startsWith('orders')) {
      return this.get(`/api/sales/${action}`, { service: 'sales' });
    } else if (action.startsWith('customers')) {
      return this.get(`/api/sales/${action}`, { service: 'sales' });
    }
    throw new Error(`Unknown sales action: ${action}`);
  }

  async warehouse(action, payload = null) {
    if (action === 'workflow') {
      return this.get('/api/inventory/warehouse', { service: 'warehouse' });
    } else if (action === 'ship') {
      return this.post('/api/inventory/warehouse', payload, { service: 'warehouse' });
    }
    throw new Error(`Unknown warehouse action: ${action}`);
  }

  async inventory(action, payload = null) {
    if (action === 'movements') {
      return this.get('/api/inventory/movements', { service: 'inventory' });
    } else if (action === 'reorder') {
      return this.post('/api/inventory/reorder-suggestion', payload, { service: 'inventory' });
    } else if (action === 'cycleCounts') {
      return this.get('/api/inventory/cycle-counts', { service: 'inventory' });
    }
    throw new Error(`Unknown inventory action: ${action}`);
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
    } else if (action === 'engine') {
      return this.get('/api/analytics/engine', { service: 'analytics' });
    }
    throw new Error(`Unknown analytics action: ${action}`);
  }

  getAuditSummary() {
    return this.auditLogger.getLogs();
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
