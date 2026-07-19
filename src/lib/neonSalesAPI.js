/**
 * Neon DB Sales API Client
 * Connects frontend to backend sales and customer APIs
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

// Sales Orders
export async function getSalesOrders(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, value);
    }
  });
  return request(`/sales/orders?${params}`);
}

export async function getSalesOrder(orderId) {
  return request(`/sales/orders/${orderId}`);
}

export async function createSalesOrder(orderData) {
  return request('/sales/orders', {
    method: 'POST',
    body: JSON.stringify(orderData),
  });
}

// Customers
export async function getCustomers(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, value);
    }
  });
  return request(`/sales/customers?${params}`);
}

export async function getCustomer(customerId) {
  return request(`/sales/customers/${customerId}`);
}

export async function createCustomer(customerData) {
  return request('/sales/customers', {
    method: 'POST',
    body: JSON.stringify(customerData),
  });
}
