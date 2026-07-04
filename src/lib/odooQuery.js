/**
 * TICKET-014: Odoo Query Contract
 *
 * Centralized schema-safe domain building, field sanitization, and search_read kwargs.
 * All domains and field sets are validated against ODOO-SCHEMA-MATRIX.md (TICKET-013).
 *
 * Rules:
 * - Never use account.account.deprecated
 * - Never request mrp.production.date_planned_start
 * - All fields must exist in FIELD_ALLOWLIST
 * - Domains must use only documented filter keys
 */

// ─────────────────────────────────────────────────────────────────────────────
// FIELD_ALLOWLIST: Model → Allowed fields (from TICKET-013 audit on HF Odoo 19)
// ─────────────────────────────────────────────────────────────────────────────

export const FIELD_ALLOWLIST = {
  'product.product': ['id', 'name', 'default_code', 'list_price', 'qty_available', 'active', 'uom_id', 'categ_id'],
  'product.category': ['id', 'name', 'complete_name', 'parent_id'],
  'stock.location': ['id', 'name', 'complete_name', 'usage'],
  'stock.quant': ['id', 'product_id', 'location_id', 'quantity', 'reserved_quantity'],
  'sale.order': ['id', 'name', 'partner_id', 'amount_total', 'state', 'date_order', 'origin'],
  'sale.order.line': ['id', 'product_id', 'product_uom_qty', 'price_unit', 'order_id'],
  'purchase.order': ['id', 'name', 'partner_id', 'date_order', 'amount_total', 'state', 'origin'],
  'purchase.order.line': ['id', 'product_id', 'product_qty', 'price_unit', 'order_id'],
  'res.partner': ['id', 'name', 'email', 'phone', 'city', 'customer_rank', 'supplier_rank'],
  'account.account': ['id', 'name', 'code', 'account_type', 'active'],
  'hr.employee': ['id', 'name', 'job_title', 'department_id', 'work_email'],
  // mrp.production: date_planned_start is MISSING on HF, so we exclude it
  'mrp.production': ['id', 'name', 'product_id', 'product_qty', 'state'],
};

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT_DOMAINS: Model → Default safe domain (minimum filters)
// ─────────────────────────────────────────────────────────────────────────────

export const DEFAULT_DOMAINS = {
  'product.product': [['active', '=', true]],
  'product.category': [],
  'stock.location': [['usage', '=', 'internal']],
  'stock.quant': [],
  'account.account': [['active', '=', true]],
  'sale.order': [],
  'purchase.order': [],
  'res.partner': [], // caller decides customer vs vendor via buildOdooDomain
  'hr.employee': [],
  'mrp.production': [],
  'sale.order.line': [],
  'purchase.order.line': [],
};

// ─────────────────────────────────────────────────────────────────────────────
// buildOdooDomain: Filter builder (schema-safe)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build an Odoo domain from model-specific filter keys.
 * Merges DEFAULT_DOMAINS[model] with filter-derived terms.
 * Rejects unknown filter keys to prevent schema drift.
 *
 * @param {string} model - Odoo model (e.g. 'product.product')
 * @param {object} filters - Filter key-value pairs (see SUPPORTED_FILTERS)
 * @returns {array} Odoo domain (e.g. [['active','=',true],['state','=','draft']])
 * @throws Error if unknown filter key or invalid model
 */
export function buildOdooDomain(model, filters = {}) {
  const defaultDomain = DEFAULT_DOMAINS[model];
  if (!defaultDomain) {
    throw new Error(`Unknown model: ${model}`);
  }

  // Start with default domain (deep copy to avoid mutation)
  let domain = JSON.parse(JSON.stringify(defaultDomain));

  // Merge filter-derived terms
  if (!filters || Object.keys(filters).length === 0) {
    return domain;
  }

  // Per-model supported filters
  const supportedFilters = {
    'product.product': ['active', 'search', 'categoryId', 'locationId'],
    'product.category': ['search'],
    'stock.location': ['search'],
    'stock.quant': ['productId', 'locationId'],
    'sale.order': ['state', 'dateFrom', 'dateTo', 'search'],
    'purchase.order': ['state', 'dateFrom', 'dateTo', 'search'],
    'account.account': ['active', 'account_type', 'search'],
    'res.partner': ['customer', 'supplier', 'search'],
    'mrp.production': ['state'],
    'hr.employee': ['search'],
    'sale.order.line': ['search'],
    'purchase.order.line': ['search'],
  };

  const allowed = supportedFilters[model] || [];

  // Validate and apply filters
  for (const [key, value] of Object.entries(filters)) {
    if (key === 'limit' || key === 'offset' || key === 'order') {
      // Skip pagination/order keys
      continue;
    }

    if (!allowed.includes(key)) {
      throw new Error(`Unknown filter key "${key}" for model ${model}. Allowed: ${allowed.join(', ')}`);
    }

    if (value === null || value === undefined) {
      continue; // Skip empty filters
    }

    // Apply specific filter logic per model
    switch (key) {
      case 'active':
        // product.product, account.account
        domain = domain.filter((d) => !(Array.isArray(d) && d[0] === 'active'));
        domain.push(['active', '=', Boolean(value)]);
        break;

      case 'search':
        // Generic text search on name/code/partner/category/location fields
        if (typeof value === 'string' && value.trim()) {
          const searchTerm = value.trim();
          if (model === 'product.product') {
            domain.push('|');
            domain.push(['name', 'ilike', searchTerm]);
            domain.push(['default_code', 'ilike', searchTerm]);
          } else if (model === 'sale.order' || model === 'purchase.order') {
            domain.push('|');
            domain.push(['name', 'ilike', searchTerm]);
            domain.push(['partner_id', 'ilike', searchTerm]);
          } else if (model === 'account.account') {
            domain.push('|');
            domain.push(['code', 'ilike', searchTerm]);
            domain.push(['name', 'ilike', searchTerm]);
          } else if (model === 'res.partner') {
            domain.push(['name', 'ilike', searchTerm]);
          } else if (model === 'hr.employee') {
            domain.push(['name', 'ilike', searchTerm]);
          } else if (model === 'product.category' || model === 'stock.location') {
            domain.push('|');
            domain.push(['name', 'ilike', searchTerm]);
            domain.push(['complete_name', 'ilike', searchTerm]);
          }
        }
        break;

      case 'categoryId':
        // product.product category filter
        if (value) {
          domain.push(['categ_id', '=', Number(value)]);
        }
        break;

      case 'locationId':
        // product.product or stock.quant location filter
        if (value) {
          const locationKey = model === 'stock.quant' ? 'location_id' : 'location_id';
          domain.push([locationKey, '=', Number(value)]);
        }
        break;

      case 'productId':
        // stock.quant product filter
        if (value) {
          domain.push(['product_id', '=', Number(value)]);
        }
        break;

      case 'state':
        // sale.order, purchase.order, mrp.production
        if (value) {
          domain.push(['state', '=', value]);
        }
        break;

      case 'dateFrom':
        // sale.order, purchase.order
        if (value) {
          domain.push(['date_order', '>=', value]);
        }
        break;

      case 'dateTo':
        // sale.order, purchase.order
        if (value) {
          domain.push(['date_order', '<=', value]);
        }
        break;

      case 'account_type':
        // account.account
        if (value) {
          domain.push(['account_type', '=', value]);
        }
        break;

      case 'customer':
        // res.partner: customer_rank > 0
        if (value === true) {
          domain = domain.filter((d) => !(Array.isArray(d) && d[0] === 'supplier_rank'));
          domain.push(['customer_rank', '>', 0]);
        }
        break;

      case 'supplier':
        // res.partner: supplier_rank > 0
        if (value === true) {
          domain = domain.filter((d) => !(Array.isArray(d) && d[0] === 'customer_rank'));
          domain.push(['supplier_rank', '>', 0]);
        }
        break;

      default:
        throw new Error(`Unhandled filter key: ${key}`);
    }
  }

  return domain;
}

// ─────────────────────────────────────────────────────────────────────────────
// sanitizeFields: Strip unsupported fields
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Return intersection of requested fields and allowed list for model.
 * Prevents requesting fields that don't exist on HF Odoo.
 *
 * @param {string} model - Odoo model
 * @param {array} requestedFields - Array of field names
 * @returns {array} Safe subset of fields from FIELD_ALLOWLIST
 */
export function sanitizeFields(model, requestedFields = []) {
  const allowed = FIELD_ALLOWLIST[model];
  if (!allowed) {
    throw new Error(`Unknown model: ${model}`);
  }

  if (!Array.isArray(requestedFields)) {
    return allowed;
  }

  // Return only fields that are in both requested and allowlist
  return requestedFields.filter((f) => allowed.includes(f));
}

// ─────────────────────────────────────────────────────────────────────────────
// buildSearchReadKwargs: Pagination + field sanitization
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build kwargs object for Odoo search_read: { fields, limit, offset, order, ... }
 *
 * @param {object} options - { fields, limit, offset, order, model }
 * @returns {object} kwargs for search_read()
 */
export function buildSearchReadKwargs({ fields, limit = 50, offset = 0, order, model } = {}) {
  const kwargs = {};

  // Sanitize fields if model provided
  if (model && fields) {
    kwargs.fields = sanitizeFields(model, fields);
  } else if (fields) {
    kwargs.fields = Array.isArray(fields) ? fields : [];
  }

  if (limit) {
    kwargs.limit = Math.max(1, Math.min(Number(limit), 500)); // Cap at 500
  }

  if (offset) {
    kwargs.offset = Math.max(0, Number(offset));
  }

  if (order) {
    kwargs.order = order;
  }

  return kwargs;
}

// ─────────────────────────────────────────────────────────────────────────────
// Contract summary for agents
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Supported filter keys per model (for documentation):
 *
 * product.product: { active, search }
 * sale.order: { state, dateFrom, dateTo, search }
 * purchase.order: { state, dateFrom, dateTo, search }
 * account.account: { active, account_type, search }
 * res.partner: { customer, supplier, search }
 * mrp.production: { state }
 * hr.employee: { search }
 *
 * Example:
 *   buildOdooDomain('product.product', { active: true, search: 'ABC' })
 *   → [['active','=',true],['|',['name','ilike','ABC'],['default_code','ilike','ABC']]]
 */
