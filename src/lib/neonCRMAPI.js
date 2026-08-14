/**
 * Neon DB CRM API Client
 * Connects frontend to backend CRM APIs
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

// CRM Pipeline
export async function getCRMPipeline(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, value);
    }
  });
  return request(`/crm/pipeline?${params}`);
}

// CRM Activity
export async function getCRMActivity(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, value);
    }
  });
  return request(`/crm/activity?${params}`);
}

export async function createCRMActivity(activityData) {
  return request('/crm/activity', {
    method: 'POST',
    body: JSON.stringify(activityData),
  });
}

// CRM Opportunities
export async function getCRMOpportunities(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, value);
    }
  });
  return request(`/crm/opportunities?${params}`);
}

// CRM Requisitions
export async function getCRMRequisitions(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, value);
    }
  });
  return request(`/crm/requisitions?${params}`);
}

export async function getCRMRequisition(requisitionId) {
  return request(`/crm/requisitions/${requisitionId}`);
}

export async function createCRMRequisition(requisitionData) {
  return request('/crm/requisitions', {
    method: 'POST',
    body: JSON.stringify(requisitionData),
  });
}