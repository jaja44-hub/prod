import xmlrpc from 'xmlrpc';
import { authenticateOdooDb } from '../api/lib/resolveOdooDb.js';

const {
  ODOO_URL,
  ODOO_DB,
  ODOO_USER,
  ODOO_APIKEY,
} = process.env;

if (!ODOO_URL || !ODOO_DB || !ODOO_USER || !ODOO_APIKEY) {
  console.error('Missing required Odoo environment variables.');
  console.error('Set ODOO_URL, ODOO_DB, ODOO_USER, and ODOO_APIKEY.');
  process.exit(1);
}

const url = new URL(ODOO_URL);

const getClient = (path) => {
  const options = {
    host: url.hostname,
    port: url.port || (url.protocol === 'https:' ? 443 : 80),
    path,
  };

  return url.protocol === 'https:'
    ? xmlrpc.createSecureClient(options)
    : xmlrpc.createClient(options);
};

const methodCall = (client, method, params = []) => new Promise((resolve, reject) => {
  client.methodCall(method, params, (error, value) => {
    if (error) reject(error);
    else resolve(value);
  });
});

const executeKw = (session, model, method, args = [], kwargs = {}) => {
  const client = getClient('/xmlrpc/2/object');
  return methodCall(client, 'execute_kw', [session.db, session.uid, ODOO_APIKEY, model, method, args, kwargs]);
};

const getVersion = async () => {
  try {
    const client = getClient('/xmlrpc/2/common');
    return await methodCall(client, 'version', []);
  } catch {
    return null;
  }
};

const rows = [
  {
    model: 'product.product',
    fields: ['id', 'name', 'qty_available', 'list_price', 'default_code', 'active', 'uom_id'],
    domain: [['active', '=', true]],
    domainLabel: "[['active','=',true]]",
    critical: true,
    requiredFor: 'Inventory',
  },
  {
    model: 'sale.order',
    fields: ['id', 'name', 'partner_id', 'amount_total', 'state', 'date_order', 'origin'],
    domain: [],
    domainLabel: '[]',
    critical: true,
    requiredFor: 'Sales',
  },
  {
    model: 'sale.order.line',
    fields: ['id', 'product_id', 'product_uom_qty', 'price_unit'],
    domain: [['order_id', '!=', false]],
    domainLabel: "by order_id",
    critical: true,
    requiredFor: 'Sales',
  },
  {
    model: 'purchase.order',
    fields: ['id', 'name', 'partner_id', 'date_order', 'amount_total', 'state', 'origin'],
    domain: [],
    domainLabel: '[]',
    critical: true,
    requiredFor: 'Purchase',
  },
  {
    model: 'purchase.order.line',
    fields: ['id', 'product_id', 'product_qty', 'price_unit'],
    domain: [['order_id', '!=', false]],
    domainLabel: "by order_id",
    critical: true,
    requiredFor: 'Purchase',
  },
  {
    model: 'res.partner',
    fields: ['id', 'name', 'email', 'phone', 'city', 'customer_rank', 'supplier_rank'],
    domain: ['|', ['customer_rank', '>', 0], ['supplier_rank', '>', 0]],
    domainLabel: 'rank filters',
    critical: true,
    requiredFor: 'Global',
  },
  {
    model: 'account.account',
    fields: ['id', 'name', 'code', 'account_type', 'active'],
    domain: [],
    domainLabel: '[]',
    critical: true,
    requiredFor: 'Finance',
  },
  {
    model: 'hr.employee',
    fields: ['id', 'name', 'job_title', 'department_id', 'work_email'],
    domain: [],
    domainLabel: '[]',
    critical: false,
    requiredFor: 'HR',
  },
  {
    model: 'mrp.production',
    fields: ['id', 'name', 'product_id', 'product_qty', 'state', 'date_planned_start'],
    domain: [],
    domainLabel: '[]',
    critical: false,
    requiredFor: 'MRP',
  },
  // TICKET-021 Wave B inventory models
  {
    model: 'product.category',
    fields: ['id', 'name', 'complete_name', 'parent_id'],
    domain: [],
    domainLabel: '[]',
    critical: true,
    requiredFor: 'Inventory v2',
  },
  {
    model: 'stock.location',
    fields: ['id', 'name', 'complete_name', 'usage'],
    domain: [['usage', '=', 'internal']],
    domainLabel: "[['usage','=','internal']]",
    critical: true,
    requiredFor: 'Inventory v2',
  },
  {
    model: 'stock.quant',
    fields: ['id', 'product_id', 'location_id', 'quantity', 'reserved_quantity'],
    domain: [['quantity', '>', 0]],
    domainLabel: "[['quantity','>',0]]",
    critical: true,
    requiredFor: 'Inventory v2',
  },
  // TICKET-021: extend product.product with categ_id
  {
    model: 'product.product',
    fields: ['id', 'name', 'default_code', 'list_price', 'qty_available', 'active', 'uom_id', 'categ_id', 'total_value'],
    domain: [['active', '=', true]],
    domainLabel: "[['active','=',true]]",
    critical: true,
    requiredFor: 'Inventory v2 (extended)',
  },
  // TICKET-022 Wave B valuation + finance models
  {
    model: 'stock.valuation.layer',
    fields: ['id', 'product_id', 'quantity', 'value', 'unit_cost', 'create_date'],
    domain: [['quantity', '!=', 0]],
    domainLabel: "[['quantity','!=',0]]",
    critical: true,
    requiredFor: 'Valuation',
  },
  {
    model: 'account.move',
    fields: ['id', 'name', 'date', 'move_type', 'state', 'amount_total', 'journal_id'],
    domain: [['move_type', 'in', ['out_invoice', 'in_invoice']]],
    domainLabel: "[['move_type','in',['out_invoice','in_invoice']]]",
    critical: true,
    requiredFor: 'Finance v2',
  },
  {
    model: 'account.payment',
    fields: ['id', 'name', 'date', 'payment_type', 'state', 'amount', 'journal_id'],
    domain: [],
    domainLabel: "[]",
    critical: true,
    requiredFor: 'Finance v2',
  },
  {
    model: 'account.journal',
    fields: ['id', 'name', 'type', 'company_id'],
    domain: [['type', 'in', ['bank', 'cash']]],
    domainLabel: "[['type','in',['bank','cash']]]",
    critical: true,
    requiredFor: 'Finance v2',
  },
];

const renderFieldStatus = (field, status, note = '') => {
  const noteText = note ? ` — ${note}` : '';
  return `${field}: ${status}${noteText}`;
};

const runAudit = async () => {
  console.log('Starting Odoo schema audit...');
  const host = url.host;
  const versionInfo = await getVersion();
  console.log(`Host: ${host}`);
  console.log(`DB: ${ODOO_DB}`);
  console.log(`Odoo version: ${versionInfo?.server_version || 'unknown'}\n`);

  const session = await authenticateOdooDb(getClient('/xmlrpc/2/common'), ODOO_DB, ODOO_USER, ODOO_APIKEY);
  if (!session) {
    console.error('Odoo authentication failed. Verify ODOO_DB, ODOO_USER, and ODOO_APIKEY.');
    process.exit(1);
  }

  let hasCriticalFailures = false;
  const matrix = [];
  const moduleChecklist = [];

  for (const row of rows) {
    console.log(`=== ${row.model} (${row.requiredFor}) ===`);
    const modelResult = {
      model: row.model,
      requiredFor: row.requiredFor,
      fields: [],
      domain: row.domainLabel,
      installStatus: 'UNKNOWN',
      notes: [],
    };

    let fieldDefinitions = null;
    try {
      fieldDefinitions = await executeKw(session, row.model, 'fields_get', [[], ['string', 'type', 'required']]);
      modelResult.installStatus = 'INSTALLED';
      console.log('Model accessible: INSTALLED');
    } catch (error) {
      modelResult.installStatus = 'MISSING';
      modelResult.notes.push(`Model access failed: ${error.message}`);
      console.log(`Model accessible: MISSING — ${error.message}`);
      if (row.critical) hasCriticalFailures = true;
    }

    if (fieldDefinitions) {
      for (const field of row.fields) {
        if (Object.prototype.hasOwnProperty.call(fieldDefinitions, field)) {
          modelResult.fields.push({ field, status: 'OK' });
          console.log(renderFieldStatus(field, 'OK'));
        } else {
          modelResult.fields.push({ field, status: 'MISSING' });
          modelResult.notes.push(`Missing field: ${field}`);
          console.log(renderFieldStatus(field, 'MISSING'));
          if (row.critical) hasCriticalFailures = true;
        }
      }

      if (row.domain && row.domain.length > 0) {
        try {
          await executeKw(session, row.model, 'search_read', [row.domain, ['id']], { limit: 1 });
          modelResult.domainStatus = 'OK';
          console.log(`Domain check: OK (${row.domainLabel})`);
        } catch (domainError) {
          modelResult.domainStatus = 'DOMAIN_ERROR';
          modelResult.notes.push(`Domain failed: ${domainError.message}`);
          console.log(`Domain check: DOMAIN_ERROR — ${domainError.message}`);
          if (row.critical) hasCriticalFailures = true;
        }
      } else {
        modelResult.domainStatus = 'SKIPPED';
        console.log(`Domain check: SKIPPED (${row.domainLabel})`);
      }
    }

    matrix.push(modelResult);
    console.log('');
  }

  console.log('=== Summary ===');
  matrix.forEach((item) => {
    const fieldIssues = item.fields.filter((f) => f.status !== 'OK').length;
    const domainNote = item.domainStatus === 'DOMAIN_ERROR' ? ' DOMAIN_ERROR' : '';
    console.log(`${item.model}: ${item.installStatus} | ${fieldIssues} field issues | ${item.domainStatus || 'N/A'}${domainNote}`);
  });

  if (hasCriticalFailures) {
    console.error('\nCritical field or domain failures detected for core 4 models.');
    process.exit(1);
  }

  console.log('\nAll critical core 4 fields and domains are OK.');
  process.exit(0);
};

runAudit().catch((error) => {
  console.error('Audit failed:', error.message || error);
  process.exit(1);
});
