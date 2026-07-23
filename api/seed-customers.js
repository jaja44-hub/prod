import { jsonError } from './lib/shared.js';
import { getPool } from './lib/shared.js';

export default async function handler(req, res) {
  try {
    const pool = getPool('accounting');
    await pool.query("INSERT INTO customers (customer_code, name, email, phone, city, country, credit_limit, active) VALUES ('CUST-001', 'Ethio Telecom', 'procurement@ethiotelecom.et', '+251-11-555-0000', 'Addis Ababa', 'Ethiopia', 500000.00, true) ON CONFLICT DO NOTHING");
    await pool.query("INSERT INTO customers (customer_code, name, email, phone, city, country, credit_limit, active) VALUES ('CUST-002', 'Commercial Bank of Ethiopia', 'purchasing@cbe.com.et', '+251-11-555-1111', 'Addis Ababa', 'Ethiopia', 750000.00, true) ON CONFLICT DO NOTHING");
    await pool.query("INSERT INTO customers (customer_code, name, email, phone, city, country, credit_limit, active) VALUES ('CUST-003', 'Ethiopian Airlines', 'supply@ethiopianairlines.com', '+251-11-665-0000', 'Addis Ababa', 'Ethiopia', 1000000.00, true) ON CONFLICT DO NOTHING");
    await pool.query("INSERT INTO customers (customer_code, name, email, phone, city, country, credit_limit, active) VALUES ('CUST-004', 'MIDROC Ethiopia', 'orders@midroc.com.et', '+251-11-555-2222', 'Addis Ababa', 'Ethiopia', 600000.00, true) ON CONFLICT DO NOTHING");
    await pool.query("INSERT INTO customers (customer_code, name, email, phone, city, country, credit_limit, active) VALUES ('CUST-005', 'BGI Ethiopia', 'procurement@bgi.com.et', '+251-11-555-3333', 'Addis Ababa', 'Ethiopia', 400000.00, true) ON CONFLICT DO NOTHING");
    return res.status(200).json({ success: true, message: 'Customers seeded' });
  } catch (error) {
    return jsonError(res, 500, error.message);
  }
}
