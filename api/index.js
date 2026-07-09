/**
 * api/index.js
 * Unified API Router - Vercel Hobby Plan compatible (single function)
 * Routes all API requests to appropriate handlers
 */

import { verifyBearerToken } from '../server/api/lib/firebaseAdmin.js';
import { enforceModuleAccess } from '../server/api/lib/policyOrchestrator.js';

// Finance handlers
import { computeAgingReport } from '../server/api/finance/aging.js';
import { matchPaymentsToInvoices } from '../server/api/finance/reconciliation.js';

// CRM handlers
import { fetchPipeline } from '../server/api/crm/pipeline.js';
import { fetchActivityTimeline } from '../server/api/crm/activity.js';

// Warehouse handlers
import { manageWarehouseWorkflow } from '../server/api/inventory/warehouse.js';

// Analytics handlers
import { computeMetrics } from '../server/api/analytics/metrics.js';
import { generateDecisions } from '../server/api/analytics/decisions.js';

// Connectors handlers
import { validateContract } from '../server/api/connectors/contracts.js';
import { executeWithRetry } from '../server/api/connectors/retries.js';
import { recordAuditEvent } from '../server/api/connectors/audit.js';

// Import from odoo and keep-alive modules
import odooProxyHandler from './odooProxy.js';
import keepAliveHandler from './keepAlive.js';

function respond(res, status, payload) {
  res.setHeader('Content-Type', 'application/json');
  return res.status(status).json(payload);
}

function setCORSHeaders(res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Content-Type, Authorization, X-Correlation-ID');
}

export default async function handler(req, res) {
  setCORSHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const path = req.url || '';
  const method = req.method;

  try {
    // Keep-alive endpoint (no auth required)
    if (path === '/api/keepAlive' || path.startsWith('/api/keepAlive?')) {
      return keepAliveHandler(req, res);
    }

    // Odoo proxy (no auth required)
    if (path.startsWith('/api/odooProxy')) {
      return odooProxyHandler(req, res);
    }

    // All other endpoints require authentication
    const context = await verifyBearerToken(req);
    if (!context) {
      return respond(res, 401, {
        success: false,
        error: 'Unauthorized - missing or invalid bearer token',
      });
    }

    // Route to handlers based on path
    // Finance module
    if (path.startsWith('/api/finance/aging')) {
      await enforceModuleAccess(context, 'finance');
      if (method !== 'GET') return respond(res, 405, { success: false, error: 'Method not allowed' });
      const report = await computeAgingReport(context);
      return respond(res, 200, { success: true, data: report });
    }

    if (path.startsWith('/api/finance/reconciliation')) {
      await enforceModuleAccess(context, 'finance');
      if (method !== 'POST') return respond(res, 405, { success: false, error: 'Method not allowed' });
      const result = await matchPaymentsToInvoices(context, req.body);
      return respond(res, 200, { success: true, data: result });
    }

    // CRM module
    if (path.startsWith('/api/crm/pipeline')) {
      await enforceModuleAccess(context, 'crm');
      if (method !== 'GET') return respond(res, 405, { success: false, error: 'Method not allowed' });
      const pipeline = await fetchPipeline(context);
      return respond(res, 200, { success: true, data: pipeline });
    }

    if (path.startsWith('/api/crm/activity')) {
      await enforceModuleAccess(context, 'crm');
      if (method !== 'GET') return respond(res, 405, { success: false, error: 'Method not allowed' });
      const activities = await fetchActivityTimeline(context);
      return respond(res, 200, { success: true, data: activities });
    }

    // Warehouse module
    if (path.startsWith('/api/inventory/warehouse') || path.startsWith('/api/warehouse')) {
      await enforceModuleAccess(context, 'warehouse');
      if (method !== 'POST') return respond(res, 405, { success: false, error: 'Method not allowed' });
      const result = await manageWarehouseWorkflow(context, req.body);
      return respond(res, 200, { success: true, data: result });
    }

    // Analytics module
    if (path.startsWith('/api/analytics/metrics')) {
      await enforceModuleAccess(context, 'analytics');
      if (method !== 'GET') return respond(res, 405, { success: false, error: 'Method not allowed' });
      const metrics = await computeMetrics(context);
      return respond(res, 200, { success: true, data: metrics });
    }

    if (path.startsWith('/api/analytics/decisions')) {
      await enforceModuleAccess(context, 'analytics');
      if (method !== 'GET') return respond(res, 405, { success: false, error: 'Method not allowed' });
      const decisions = await generateDecisions(context);
      return respond(res, 200, { success: true, data: decisions });
    }

    // Connectors module
    if (path.startsWith('/api/connectors/contracts')) {
      await enforceModuleAccess(context, 'connectors');
      if (method !== 'POST') return respond(res, 405, { success: false, error: 'Method not allowed' });
      const validation = await validateContract(context, req.body);
      return respond(res, 200, { success: true, data: validation });
    }

    // 404 - Not found
    return respond(res, 404, {
      success: false,
      error: 'Endpoint not found',
      path,
    });
  } catch (error) {
    console.error('API Error:', error);
    return respond(res, 500, {
      success: false,
      error: error.message || 'Internal server error',
    });
  }
}
