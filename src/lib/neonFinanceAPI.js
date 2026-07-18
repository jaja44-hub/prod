const API_BASE = process.env.REACT_APP_API_BASE || (window.location.hostname === 'localhost' ? 'http://localhost:3001/api' : '/api');

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    'X-Tenant-Id': 'tenant_default',
    ...options.headers
  };
  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || error.message || 'Request failed');
  }
  return response.json();
}

export async function getJournalEntries(filters = {}) {
  const params = new URLSearchParams();
  if (filters.tenant_id) params.append('tenant_id', filters.tenant_id);
  if (filters.entry_type) params.append('entry_type', filters.entry_type);
  if (filters.limit) params.append('limit', filters.limit);
  return request(`/finance/journal?${params.toString()}`);
}

export async function createJournalEntryFromPO(poId) {
  return request(`/finance/journal/from-po/${poId}`, { method: 'POST' });
}

export async function createJournalEntryFromReceipt(receiptId) {
  return request(`/finance/journal/from-receipt/${receiptId}`, { method: 'POST' });
}

export async function getBudgetVariance(tenantId, categoryId) {
  const params = new URLSearchParams();
  params.append('tenant_id', tenantId);
  if (categoryId) params.append('category_id', categoryId);
  return request(`/finance/budget-variance?${params.toString()}`);
}

export async function getFinanceAging(tenantId) {
  return request(`/finance/aging?tenant_id=${tenantId}`);
}
