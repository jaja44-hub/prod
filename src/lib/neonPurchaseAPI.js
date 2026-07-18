/**
 * Neon DB Purchase API Client
 * Connects frontend to backend purchase APIs
 */

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3000/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'API request failed');
  }

  return response.json();
}

// Purchase Requisitions
export async function getPurchaseRequisitions(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, value);
    }
  });
  return request(`/purchase/requisitions?${params}`);
}

export async function getPurchaseRequisition(id) {
  return request(`/purchase/requisitions/${id}`);
}

export async function createPurchaseRequisition(data) {
  return request('/purchase/requisitions', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updatePurchaseRequisition(id, data) {
  return request(`/purchase/requisitions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function submitPurchaseRequisition(id, submitterData) {
  return request(`/purchase/requisitions/${id}/submit`, {
    method: 'POST',
    body: JSON.stringify(submitterData),
  });
}

export async function approvePurchaseRequisition(id, approverData) {
  return request(`/purchase/requisitions/${id}/approve`, {
    method: 'POST',
    body: JSON.stringify(approverData),
  });
}

export async function rejectPurchaseRequisition(id, rejectorData) {
  return request(`/purchase/requisitions/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify(rejectorData),
  });
}

// Purchase Orders
export async function getPurchaseOrders(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, value);
    }
  });
  return request(`/purchase/orders?${params}`);
}

export async function getPurchaseOrder(id) {
  return request(`/purchase/orders/${id}`);
}

export async function createPurchaseOrder(data) {
  return request('/purchase/orders', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function createPurchaseOrderFromRequisition(requisitionId, data) {
  return request(`/purchase/orders/from-requisition/${requisitionId}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updatePurchaseOrder(id, data) {
  return request(`/purchase/orders/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function submitPurchaseOrder(id, submitterData) {
  return request(`/purchase/orders/${id}/submit`, {
    method: 'POST',
    body: JSON.stringify(submitterData),
  });
}

export async function approvePurchaseOrder(id, approverData) {
  return request(`/purchase/orders/${id}/approve`, {
    method: 'POST',
    body: JSON.stringify(approverData),
  });
}

export async function sendPurchaseOrderToSupplier(id, senderData) {
  return request(`/purchase/orders/${id}/send`, {
    method: 'POST',
    body: JSON.stringify(senderData),
  });
}

// Suppliers
export async function getSuppliers(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, value);
    }
  });
  return request(`/purchase/suppliers?${params}`);
}

export async function getSupplier(id) {
  return request(`/purchase/suppliers/${id}`);
}

export async function getSuppliersByCategory(tenantId, categoryId) {
  return request(`/purchase/suppliers/category/${categoryId}?tenant_id=${tenantId}`);
}

export async function getSupplierPerformanceReport(tenantId, startDate, endDate) {
  const params = new URLSearchParams();
  if (tenantId) params.append('tenant_id', tenantId);
  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);
  return request(`/purchase/suppliers-performance?${params}`);
}

// Budget
export async function checkBudgetAvailability(budgetId, requiredAmount) {
  return request('/purchase/budget/check-availability', {
    method: 'POST',
    body: JSON.stringify({ budget_id: budgetId, required_amount: requiredAmount }),
  });
}

export async function validateRequisitionBudget(requisitionId) {
  return request(`/purchase/budget/requisitions/${requisitionId}/validate`, {
    method: 'POST',
  });
}

export async function validatePOBudget(poId) {
  return request(`/purchase/budget/orders/${poId}/validate`, {
    method: 'POST',
  });
}

export async function getBudgetUtilizationReport(tenantId, fiscalYear, fiscalPeriod) {
  const params = new URLSearchParams();
  if (tenantId) params.append('tenant_id', tenantId);
  if (fiscalYear) params.append('fiscal_year', fiscalYear);
  if (fiscalPeriod) params.append('fiscal_period', fiscalPeriod);
  return request(`/purchase/budget/utilization?${params}`);
}
