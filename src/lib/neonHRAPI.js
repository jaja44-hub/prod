/**
 * Neon DB HR API Client
 * Connects frontend to backend HR and employee APIs
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

// Employees
export async function getEmployees(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, value);
    }
  });
  return request(`/hr/employees?${params}`);
}

export async function getEmployee(employeeId) {
  return request(`/hr/employees/${employeeId}`);
}

export async function createEmployee(employeeData) {
  return request('/hr/employees', {
    method: 'POST',
    body: JSON.stringify(employeeData),
  });
}
