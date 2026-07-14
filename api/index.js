/**
 * api/index.js
 * Unified API Router - Vercel Hobby Plan compatible (single function)
 * Routes all API requests to appropriate handlers
 */

import { verifyBearerToken } from '../server/api/lib/firebaseAdmin.js';
import { enforceModuleAccess } from '../server/api/lib/policyOrchestrator.js';

// Finance handlers
import financeAgingHandler from '../server/api/finance/aging.js';
import financeReconciliationHandler from '../server/api/finance/reconciliation.js';

// CRM handlers
import crmPipelineHandler from '../server/api/crm/pipeline.js';
import crmActivityHandler from '../server/api/crm/activity.js';

// Warehouse handlers
import warehouseHandler from '../server/api/inventory/warehouse.js';
import inventoryMovementsHandler from '../server/api/inventory/movements.js';
import reorderSuggestionHandler from '../server/api/inventory/reorder-suggestion.js';
import cycleCountHandler from '../server/api/inventory/cycle-counts.js';

// Analytics handlers
import analyticsMetricsHandler from '../server/api/analytics/metrics.js';
import analyticsDecisionsHandler from '../server/api/analytics/decisions.js';
import analyticsEngineHandler from '../server/api/analytics/engine.js';

// Connectors handlers
// Connector routes are not implemented in this branch; placeholder routing is omitted.

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

    // Analytics endpoints (no auth required for development/testing)
    if (path.startsWith('/api/analytics/engine')) {
      return analyticsEngineHandler(req, res);
    }
    if (path.startsWith('/api/analytics/metrics')) {
      return analyticsMetricsHandler(req, res);
    }
    if (path.startsWith('/api/analytics/decisions')) {
      return analyticsDecisionsHandler(req, res);
    }

    // Warehouse endpoints (no auth required for development/testing)
    if (path.startsWith('/api/inventory/warehouse') || path.startsWith('/api/warehouse')) {
      return warehouseHandler(req, res);
    }
    if (path.startsWith('/api/inventory/movements')) {
      return inventoryMovementsHandler(req, res);
    }
    if (path.startsWith('/api/inventory/cycle-counts')) {
      return cycleCountHandler(req, res);
    }

    // Finance endpoints (no auth required for development/testing)
    if (path.startsWith('/api/finance/aging')) {
      return financeAgingHandler(req, res);
    }
    if (path.startsWith('/api/finance/reconciliation')) {
      return financeReconciliationHandler(req, res);
    }

    // CRM endpoints (no auth required for development/testing)
    if (path.startsWith('/api/crm/pipeline')) {
      return crmPipelineHandler(req, res);
    }
    if (path.startsWith('/api/crm/activity')) {
      return crmActivityHandler(req, res);
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
      return financeAgingHandler(req, res);
    }

    if (path.startsWith('/api/finance/reconciliation')) {
      return financeReconciliationHandler(req, res);
    }

    // CRM module
    if (path.startsWith('/api/crm/pipeline')) {
      return crmPipelineHandler(req, res);
    }

    if (path.startsWith('/api/crm/activity')) {
      return crmActivityHandler(req, res);
    }

    // Sales module - quotes & orders
    if (path.startsWith('/api/sales/quotes')) {
      const mod = await import('../server/api/sales/quotes.js');
      return mod.default(req, res);
    }

    if (path.startsWith('/api/sales/orders')) {
      const mod = await import('../server/api/sales/orders.js');
      return mod.default(req, res);
    }

    // Sales commission & recurring
    if (path.startsWith('/api/sales/commission')) {
      const mod = await import('../server/api/sales/commission-recurring.js');
      return mod.default(req, res);
    }

    // Purchase RFQ and receipts
    if (path.startsWith('/api/purchase/rfq')) {
      const mod = await import('../server/api/purchase/rfq.js');
      return mod.default(req, res);
    }

    if (path.startsWith('/api/purchase/receipts')) {
      const mod = await import('../server/api/purchase/receipts.js');
      return mod.default(req, res);
    }

    if (path.startsWith('/api/purchase/vendor-performance')) {
      const mod = await import('../server/api/purchase/vendor-performance.js');
      return mod.default(req, res);
    }

    // Inventory valuation
    if (path.startsWith('/api/inventory/valuation')) {
      const mod = await import('../server/api/inventory/valuation.js');
      return mod.default(req, res);
    }

    // Finance: payment batching
    if (path.startsWith('/api/finance/payment-batching')) {
      const mod = await import('../server/api/finance/payment-batching.js');
      return mod.default(req, res);
    }

    // Shipping label service
    if (path.startsWith('/api/shipping/label')) {
      const mod = await import('../server/api/shipping/label-service.js');
      return mod.default(req, res);
    }

    // Inventory lot tracking
    if (path.startsWith('/api/inventory/lot')) {
      const mod = await import('../server/api/inventory/lot-tracking.js');
      return mod.default(req, res);
    }

    // Inventory cycle scheduler
    if (path.startsWith('/api/inventory/cycle-scheduler')) {
      const mod = await import('../server/api/inventory/cycle-scheduler.js');
      return mod.default(req, res);
    }

    // Audit logging
    if (path.startsWith('/api/audit/logs')) {
      const mod = await import('../server/api/audit/logging.js');
      return mod.default(req, res);
    }

    // Warehouse module
    if (path.startsWith('/api/inventory/warehouse') || path.startsWith('/api/warehouse')) {
      return warehouseHandler(req, res);
    }

    // Inventory module
    if (path.startsWith('/api/inventory/movements')) {
      return inventoryMovementsHandler(req, res);
    }

    if (path.startsWith('/api/inventory/reorder-suggestion')) {
      return reorderSuggestionHandler(req, res);
    }

    if (path.startsWith('/api/inventory/cycle-counts')) {
      return cycleCountHandler(req, res);
    }

    // Analytics module routes
    if (path.startsWith('/api/analytics/metrics')) {
      return analyticsMetricsHandler(req, res);
    }

    if (path.startsWith('/api/analytics/decisions')) {
      return analyticsDecisionsHandler(req, res);
    }

    if (path.startsWith('/api/analytics/engine')) {
      return analyticsEngineHandler(req, res);
    }

    // Connector routes are not available in this branch.

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
