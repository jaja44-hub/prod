/**
 * server/api/lib/connectors/retries.js
 * Retry logic, exponential backoff, and circuit breaker patterns.
 */

export function exponentialBackoff(attempt = 0, baseDelayMs = 100, maxDelayMs = 10000) {
  const delay = Math.min(baseDelayMs * Math.pow(2, attempt), maxDelayMs);
  return Math.round(delay + Math.random() * (delay * 0.1));
}

export async function retryWithBackoff(
  fn,
  maxAttempts = 3,
  baseDelayMs = 100,
  shouldRetry = (error) => true
) {
  let lastError;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts - 1 && shouldRetry(error)) {
        const delay = exponentialBackoff(attempt, baseDelayMs);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

export class CircuitBreaker {
  constructor(failureThreshold = 5, resetTimeoutMs = 60000) {
    this.failureThreshold = failureThreshold;
    this.resetTimeoutMs = resetTimeoutMs;
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.state = 'closed'; // closed | open | half-open
  }

  async execute(fn) {
    if (this.state === 'open') {
      const timeSinceLastFailure = Date.now() - this.lastFailureTime;
      if (timeSinceLastFailure > this.resetTimeoutMs) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();
      if (this.state === 'half-open') {
        this.state = 'closed';
        this.failureCount = 0;
      }
      return result;
    } catch (error) {
      this.failureCount++;
      this.lastFailureTime = Date.now();

      if (this.failureCount >= this.failureThreshold) {
        this.state = 'open';
      }

      throw error;
    }
  }

  getState() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime,
    };
  }
}

export async function executeWithTimeout(promise, timeoutMs = 5000) {
  let timeoutHandle;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new Error(`Operation timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutHandle);
  }
}

export function buildRetryConfig(serviceType = 'odoo') {
  const configs = {
    odoo: {
      maxAttempts: 3,
      baseDelayMs: 200,
      shouldRetry: (error) => error.statusCode >= 500 || error.message.includes('timeout'),
    },
    api: {
      maxAttempts: 3,
      baseDelayMs: 100,
      shouldRetry: (error) => error.statusCode >= 500,
    },
  };
  return configs[serviceType] || configs.api;
}
