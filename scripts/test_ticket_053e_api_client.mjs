import { ApiClient, initApiClient, getApiClient } from '../api/client.js';

(async () => {
  try {
    const client = new ApiClient({
      baseUrl: 'http://localhost:3000',
      authToken: 'test-token-123',
      tenantId: 'test-tenant',
    });

    if (client.authToken !== 'test-token-123') throw new Error('Auth token not set');
    if (client.tenantId !== 'test-tenant') throw new Error('Tenant ID not set');

    client.setAuthToken('updated-token');
    client.setTenantId('updated-tenant');
    if (client.authToken !== 'updated-token' || client.tenantId !== 'updated-tenant') {
      throw new Error('Token/tenant update failed');
    }

    const initialized = initApiClient({
      baseUrl: 'http://localhost:3000',
      authToken: 'init-token',
    });
    if (initialized.authToken !== 'init-token') throw new Error('Init client failed');

    const singleton = getApiClient();
    if (!singleton) throw new Error('Singleton retrieval failed');

    const headers = client.buildHeaders({ custom: 'header' });
    if (!headers['X-Correlation-ID'] || headers['X-Tenant-ID'] !== 'updated-tenant') {
      throw new Error('Headers construction failed');
    }

    const summary = client.getAuditSummary();
    if (!summary || typeof summary.totalEvents !== 'number') throw new Error('Audit summary format wrong');

    console.log('TICKET-053e API client tests passed');
    process.exit(0);
  } catch (err) {
    console.error('TICKET-053e tests failed', err);
    process.exit(2);
  }
})();
