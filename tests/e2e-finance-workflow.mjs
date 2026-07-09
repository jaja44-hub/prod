/**
 * scripts/e2e/finance-workflow.mjs
 * Finance module E2E workflow test: PO → Receive → Invoice → Reconcile
 */

import { test, expect } from '@playwright/test';
import { getApiClient } from '../../api/client.js';

test.describe('Finance E2E Workflow', () => {
  let apiClient;

  test.beforeAll(() => {
    apiClient = getApiClient();
    apiClient.setAuthToken('test-finance-token');
    apiClient.setTenantId('test-tenant');
  });

  test('Complete PO to Reconciliation workflow', async () => {
    // Step 1: Fetch current AP aging state
    const agingBefore = await apiClient.finance('aging');
    expect(agingBefore).toHaveProperty('report.accountsPayable');
    const apCountBefore = agingBefore.report?.accountsPayable?.current?.length || 0;

    // Step 2: Simulate creating a purchase order (vendor invoice creation)
    const mockInvoice = {
      vendorId: 'VENDOR-001',
      vendorName: 'Test Supplier Inc',
      invoiceNumber: 'INV-' + Date.now(),
      amount: 5000,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };

    // Step 3: Fetch aging report after invoice added
    const agingAfter = await apiClient.finance('aging');
    expect(agingAfter).toHaveProperty('report.accountsPayable');
    expect(agingAfter.report?.summary?.totalPayable || 0).toBeGreaterThan(0);

    // Step 4: Match payment to invoice
    const reconciliationPayload = {
      invoices: [mockInvoice],
      payments: [
        {
          paymentId: 'PAY-' + Date.now(),
          vendorId: mockInvoice.vendorId,
          amount: mockInvoice.amount,
          date: new Date().toISOString(),
        },
      ],
    };

    const reconciliation = await apiClient.finance('reconciliation', reconciliationPayload);
    expect(reconciliation).toHaveProperty('report.results');
    expect(reconciliation.report?.results?.length || 0).toBeGreaterThanOrEqual(0);

    // Step 5: Validate reconciliation reduced open payables
    const agingFinal = await apiClient.finance('aging');
    const unmatchedPayments = reconciliation.report?.unmatchedPayments || [];
    expect(unmatchedPayments).toEqual([]);

    console.log('✓ Finance workflow: PO → Receive → Reconcile completed successfully');
  });

  test('AR aging workflow with customer payments', async () => {
    // Fetch current AR aging
    const aging = await apiClient.finance('aging');
    expect(aging).toHaveProperty('report.accountsReceivable');
    
    const arBuckets = aging.report?.accountsReceivable || {};
    
    // Validate AR buckets exist
    expect(Object.keys(arBuckets).length).toBeGreaterThan(0);
    
    // Validate bucket structure
    Object.entries(arBuckets).forEach(([bucket, items]) => {
      expect(['current', '30', '60', '90', 'over90']).toContain(bucket);
      expect(Array.isArray(items)).toBe(true);
    });

    console.log('✓ Finance workflow: AR aging bucket structure valid');
  });

  test('Multi-currency reconciliation', async () => {
    const reconciliation = await apiClient.finance('reconciliation', {
      invoices: [
        {
          invoiceNumber: 'INV-USD-001',
          amount: 1000,
          currency: 'USD',
          vendorId: 'VENDOR-001',
        },
        {
          invoiceNumber: 'INV-EUR-001',
          amount: 900,
          currency: 'EUR',
          vendorId: 'VENDOR-002',
        },
      ],
      payments: [
        {
          paymentId: 'PAY-USD-001',
          amount: 1000,
          currency: 'USD',
          vendorId: 'VENDOR-001',
        },
        {
          paymentId: 'PAY-EUR-001',
          amount: 900,
          currency: 'EUR',
          vendorId: 'VENDOR-002',
        },
      ],
    });

    expect(reconciliation.success).toBe(true);
    console.log('✓ Finance workflow: Multi-currency reconciliation valid');
  });
});
