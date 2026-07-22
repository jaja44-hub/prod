#!/usr/bin/env node
import pg from 'pg';
const { Client } = pg;

// Use accounting database for sales, CRM, and HR data
const DB_URL = process.env.NEON_ACCOUNTING_DB_URL || process.env.NEONACCOUNTINGDBURL || 'postgresql://neondb_owner:npg_sUbwp0cAWdH3@ep-solitary-dew-auii1z3j.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function seedData() {
  const client = new Client({ connectionString: DB_URL });
  await client.connect();

  try {
    console.log('Seeding Sales, HR, and CRM data...');

    // Create tables if they don't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS employees (
        id SERIAL PRIMARY KEY,
        employee_id VARCHAR(50) UNIQUE NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        department VARCHAR(50),
        position VARCHAR(100),
        hire_date DATE NOT NULL,
        salary DECIMAL(12, 2),
        tax_bracket VARCHAR(20),
        status VARCHAR(20) DEFAULT 'active',
        tenant_id VARCHAR(100) DEFAULT 'tenant_default',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS sales_orders (
        id SERIAL PRIMARY KEY,
        order_number VARCHAR(50) UNIQUE NOT NULL,
        customer_name VARCHAR(200) NOT NULL,
        customer_email VARCHAR(100),
        order_date DATE NOT NULL,
        delivery_date DATE,
        total_amount DECIMAL(12, 2) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        payment_status VARCHAR(20) DEFAULT 'unpaid',
        tenant_id VARCHAR(100) DEFAULT 'tenant_default',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS crm_opportunities (
        id SERIAL PRIMARY KEY,
        opportunity_id VARCHAR(50) UNIQUE NOT NULL,
        deal_name VARCHAR(200) NOT NULL,
        account_name VARCHAR(200),
        contact_name VARCHAR(100),
        stage VARCHAR(50) NOT NULL,
        value DECIMAL(12, 2),
        probability INTEGER,
        expected_close_date DATE,
        tenant_id VARCHAR(100) DEFAULT 'tenant_default',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Tables created successfully');

    // Seed employees (Ethiopian-contextualized)
    const employees = [
      ['EMP001', 'Dawit', 'Abebe', 'dawit.abebe@example.com', 'Finance', 'Accountant', '2024-01-15', 25000.00, '10-15%', 'active'],
      ['EMP002', 'Sara', 'Tadesse', 'sara.tadesse@example.com', 'HR', 'HR Manager', '2023-06-01', 35000.00, '15-20%', 'active'],
      ['EMP003', 'Kaleb', 'Mengistu', 'kaleb.mengistu@example.com', 'Procurement', 'Purchasing Officer', '2024-02-20', 28000.00, '10-15%', 'active'],
      ['EMP004', 'Hanna', 'Gebremariam', 'hanna.gebremariam@example.com', 'Sales', 'Sales Representative', '2023-11-10', 22000.00, '10-15%', 'active'],
      ['EMP005', 'Mikael', 'Tekle', 'mikael.tekle@example.com', 'Warehouse', 'Warehouse Manager', '2023-08-05', 30000.00, '15-20%', 'active'],
      ['EMP006', 'Ruth', 'Bekele', 'ruth.bekele@example.com', 'IT', 'IT Specialist', '2024-03-01', 32000.00, '15-20%', 'active'],
      ['EMP007', 'Daniel', 'Yohannes', 'daniel.yohannes@example.com', 'Finance', 'Financial Analyst', '2023-09-15', 27000.00, '10-15%', 'active'],
      ['EMP008', 'Selam', 'Haile', 'selam.haile@example.com', 'Operations', 'Operations Manager', '2023-07-20', 38000.00, '20-25%', 'active'],
      ['EMP009', 'Yonas', 'Kassa', 'yonas.kassa@example.com', 'Sales', 'Sales Manager', '2023-05-10', 40000.00, '20-25%', 'active'],
      ['EMP010', 'Bethlehem', 'Abraham', 'bethlehem.abraham@example.com', 'Marketing', 'Marketing Specialist', '2024-01-25', 24000.00, '10-15%', 'active'],
    ];

    for (const emp of employees) {
      await client.query(
        `INSERT INTO employees (employee_id, first_name, last_name, email, department, position, hire_date, salary, tax_bracket, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (employee_id) DO NOTHING`,
        emp
      );
    }
    console.log(`Seeded ${employees.length} employees`);

    // Seed sales orders (Ethiopian-contextualized)
    const salesOrders = [
      ['SO-2024-001', 'Ethio Telecom', 'procurement@ethiotelecom.et', '2024-06-01', '2024-06-15', 150000.00, 'delivered', 'paid'],
      ['SO-2024-002', 'Commercial Bank of Ethiopia', 'purchasing@cbe.com.et', '2024-06-05', '2024-06-20', 85000.00, 'shipped', 'partial'],
      ['SO-2024-003', 'Ethiopian Airlines', 'supply@ethiopianairlines.com', '2024-06-10', '2024-06-25', 220000.00, 'processing', 'unpaid'],
      ['SO-2024-004', 'MIDROC Ethiopia', 'orders@midroc.com.et', '2024-06-12', '2024-06-27', 120000.00, 'pending', 'unpaid'],
      ['SO-2024-005', 'BGI Ethiopia', 'procurement@bgi.com.et', '2024-06-15', '2024-06-30', 95000.00, 'processing', 'unpaid'],
      ['SO-2024-006', 'Dashen Brewery', 'purchasing@dashenbrewery.com.et', '2024-06-18', '2024-07-03', 175000.00, 'shipped', 'partial'],
      ['SO-2024-007', 'Ethiopian Electric Power', 'procurement@eep.gov.et', '2024-06-20', '2024-07-05', 280000.00, 'pending', 'unpaid'],
      ['SO-2024-008', 'Ethiopian Shipping Lines', 'orders@esl.com.et', '2024-06-22', '2024-07-08', 135000.00, 'processing', 'unpaid'],
      ['SO-2024-009', 'Mugher Cement Factory', 'purchasing@mughercement.com.et', '2024-06-25', '2024-07-10', 195000.00, 'pending', 'unpaid'],
      ['SO-2024-010', 'Ethiopian Petroleum Enterprise', 'orders@epe.gov.et', '2024-06-28', '2024-07-13', 310000.00, 'pending', 'unpaid'],
    ];

    for (const order of salesOrders) {
      await client.query(
        `INSERT INTO sales_orders (order_number, customer_name, customer_email, order_date, delivery_date, total_amount, status, payment_status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (order_number) DO NOTHING`,
        order
      );
    }
    console.log(`Seeded ${salesOrders.length} sales orders`);

    // Seed CRM opportunities (Ethiopian-contextualized)
    const opportunities = [
      ['OPP-2024-001', 'Enterprise Software License - Tele', 'Ethio Telecom', 'Abebe Kebede', 'Proposal', 450000.00, 60, '2024-07-15'],
      ['OPP-2024-002', 'Warehouse Management System', 'Commercial Bank of Ethiopia', 'Dawit Zewdu', 'Negotiation', 280000.00, 75, '2024-07-20'],
      ['OPP-2024-003', 'HR Management Platform', 'Ethiopian Airlines', 'Sara Tesfaye', 'Qualification', 350000.00, 30, '2024-08-01'],
      ['OPP-2024-004', 'Inventory Tracking Solution', 'MIDROC Ethiopia', 'Kaleb Asfaw', 'Proposal', 180000.00, 50, '2024-07-25'],
      ['OPP-2024-005', 'Financial Analytics Suite', 'BGI Ethiopia', 'Hanna Mekonnen', 'Negotiation', 220000.00, 80, '2024-07-18'],
      ['OPP-2024-006', 'Supply Chain Integration', 'Dashen Brewery', 'Mikael Girma', 'Qualification', 320000.00, 25, '2024-08-05'],
      ['OPP-2024-007', 'Enterprise Resource Planning', 'Ethiopian Electric Power', 'Ruth Tadesse', 'Proposal', 550000.00, 45, '2024-08-10'],
      ['OPP-2024-008', 'Customer Relationship Management', 'Ethiopian Shipping Lines', 'Daniel Bekele', 'Negotiation', 290000.00, 70, '2024-07-22'],
      ['OPP-2024-009', 'Business Intelligence Tools', 'Mugher Cement Factory', 'Selam Yohannes', 'Qualification', 240000.00, 35, '2024-08-03'],
      ['OPP-2024-010', 'Procurement Automation System', 'Ethiopian Petroleum Enterprise', 'Yonas Kassa', 'Proposal', 380000.00, 55, '2024-08-08'],
    ];

    for (const opp of opportunities) {
      await client.query(
        `INSERT INTO crm_opportunities (opportunity_id, deal_name, account_name, contact_name, stage, value, probability, expected_close_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (opportunity_id) DO NOTHING`,
        opp
      );
    }
    console.log(`Seeded ${opportunities.length} CRM opportunities`);

    console.log('✅ Sales, HR, and CRM data seeded successfully');
  } catch (error) {
    console.error('Error seeding data:', error);
    throw error;
  } finally {
    await client.end();
  }
}

seedData().catch(console.error);
