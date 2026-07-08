import assert from 'node:assert/strict';
import { buildApprovalLogicContext } from '../src/lib/approvalLogicContext.js';

const financeApproval = {
  id: 'approval-100',
  module: 'Finance',
  title: 'Invoice review',
  amount: 15000,
  requestedBy: 'ops@example.com',
};

const financeContext = buildApprovalLogicContext(financeApproval, 'tenant-a');
assert.equal(financeContext.advisory.module, 'gibi_sales_service_publish');
assert.equal(financeContext.settlement.module, 'gibi_sales_settlement');
assert.equal(financeContext.advisory.tenantId, 'tenant-a');
assert.equal(financeContext.settlement.appliesWht, true);
assert.equal(financeContext.settlement.subtotal, 15000);

const hrApproval = {
  id: 'approval-101',
  module: 'HR',
  title: 'Employee onboarding',
  amount: 0,
  requestedBy: 'hr@example.com',
};

const hrContext = buildApprovalLogicContext(hrApproval, 'tenant-b');
assert.equal(hrContext.advisory.module, 'legal_commerce_cost_estimator');
assert.equal(hrContext.settlement.module, 'legal_commerce_service_cost');
assert.equal(hrContext.advisory.contextType, 'hr_employee');

console.log('Ticket 039 workflow wiring regression passed.');
