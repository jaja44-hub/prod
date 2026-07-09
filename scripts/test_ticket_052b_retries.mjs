import { exponentialBackoff, retryWithBackoff, CircuitBreaker, executeWithTimeout, buildRetryConfig } from '../api/connectors/retries.js';

(async () => {
  try {
    const backoff0 = exponentialBackoff(0, 100, 10000);
    if (backoff0 < 100 || backoff0 > 120) throw new Error('Backoff calculation for attempt 0 wrong');

    const backoff3 = exponentialBackoff(3, 100, 10000);
    if (backoff3 < 700 || backoff3 > 900) throw new Error('Backoff calculation for attempt 3 wrong');

    let callCount = 0;
    const succeedOnThirdTry = async () => {
      callCount++;
      if (callCount < 3) throw new Error('Simulated failure');
      return 'success';
    };

    const result = await retryWithBackoff(succeedOnThirdTry, 5, 10);
    if (result !== 'success' || callCount !== 3) throw new Error('Retry logic failed');

    const breaker2 = new CircuitBreaker(2, 1000);
    let circuitTestCount = 0;
    const alwaysFail = async () => {
      circuitTestCount++;
      throw new Error('Always fails');
    };

    let circuitOpenThrown = false;
    for (let i = 0; i < 5; i++) {
      try {
        await breaker2.execute(alwaysFail);
      } catch (err) {
        if (err.message.includes('Circuit breaker is OPEN')) {
          circuitOpenThrown = true;
          break;
        }
      }
    }
    if (!circuitOpenThrown) {
      const state = breaker2.getState();
      throw new Error(`Circuit breaker should have opened. State: ${state.state}, failures: ${state.failureCount}`);
    }

    let timeoutThrown = false;
    try {
      await executeWithTimeout(new Promise((r) => setTimeout(r, 10000)), 100);
    } catch (err) {
      if (err.message.includes('timed out')) timeoutThrown = true;
    }
    if (!timeoutThrown) throw new Error('Timeout should have been thrown');

    const config = buildRetryConfig('odoo');
    if (config.maxAttempts !== 3 || config.timeoutMs !== 5000) throw new Error('Retry config parsing failed');

    console.log('TICKET-052b Retry & timeout tests passed');
    process.exit(0);
  } catch (err) {
    console.error('TICKET-052b tests failed', err);
    process.exit(2);
  }
})();
