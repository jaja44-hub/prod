/**
 * Neon DB Analytics API Client
 * Connects frontend to backend analytics APIs
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

// Analytics Metrics
export async function getAnalyticsMetrics(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, value);
    }
  });
  return request(`/analytics/metrics?${params}`);
}

// Analytics Decisions
export async function getAnalyticsDecisions(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, value);
    }
  });
  return request(`/analytics/decisions?${params}`);
}

export async function createAnalyticsDecision(decisionData) {
  return request('/analytics/decisions', {
    method: 'POST',
    body: JSON.stringify(decisionData),
  });
}

// Analytics Engine
export async function getAnalyticsEngine() {
  return request('/analytics/engine');
}

// Analytics Snapshot
export async function getAnalyticsSnapshot() {
  return request('/analytics/snapshot');
}

// Analytics Health
export async function getAnalyticsHealth() {
  return request('/analytics/health');
}

// Analytics Activity
export async function getAnalyticsActivity() {
  return request('/analytics/activity');
}

// Analytics Requisitions
export async function getAnalyticsRequisitions(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, value);
    }
  });
  return request(`/analytics/requisitions?${params}`);
}

export async function getAnalyticsRequisition(requisitionId) {
  return request(`/analytics/requisitions/${requisitionId}`);
}

export async function createAnalyticsRequisition(requisitionData) {
  return request('/analytics/requisitions', {
    method: 'POST',
    body: JSON.stringify(requisitionData),
  });
}