/**
 * Neon DB Warehouse API Client
 * Connects frontend to backend warehouse and receipt APIs
 */

const API_BASE = process.env.REACT_APP_API_BASE || (window.location.hostname === 'localhost' ? 'http://localhost:3001/api' : '/api');

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

// Warehouse Receipts
export async function getWarehouseReceipts(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, value);
    }
  });
  return request(`/purchase/receipts?${params}`);
}

export async function getWarehouseReceipt(receiptId) {
  return request(`/purchase/receipts/${receiptId}`);
}

export async function createWarehouseReceiptFromPO(poId, receiptData) {
  return request(`/purchase/receipts/from-po/${poId}`, {
    method: 'POST',
    body: JSON.stringify(receiptData),
  });
}

export async function processWarehouseReceipt(receiptId, processingData) {
  return request(`/purchase/receipts/${receiptId}/process`, {
    method: 'POST',
    body: JSON.stringify(processingData),
  });
}

// Warehouse Workflow (Pick/Pack/Ship)
export async function getWarehouseWorkflow(tenantId = 'tenant_default') {
  return request('/inventory/warehouse', {
    headers: {
      'X-Tenant-ID': tenantId,
    },
  });
}

export async function getCycleCounts(tenantId = 'tenant_default') {
  return request('/inventory/cycle-counts', {
    headers: {
      'X-Tenant-ID': tenantId,
    },
  });
}

export async function createWarehouseTransfer(transferData) {
  return request('/inventory/warehouse', {
    method: 'POST',
    body: JSON.stringify({ ...transferData, type: 'transfer' }),
  });
}

export async function createWarehouseShipment(shipmentData) {
  return request('/inventory/warehouse', {
    method: 'POST',
    body: JSON.stringify(shipmentData),
  });
}

// Inventory Transactions (if available)
export async function getInventoryTransactions(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, value);
    }
  });
  return request(`/inventory/transactions?${params}`);
}

export async function getInventoryProducts(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, value);
    }
  });
  return request(`/inventory/products?${params}`);
}

export async function getInventoryLocations(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, value);
    }
  });
  return request(`/inventory/locations?${params}`);
}
