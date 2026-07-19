/**
 * Supplier Management System
 * Handles supplier master data management and category-based classification
 */

const { Pool } = require('pg');

// Database connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

/**
 * Generate supplier code
 */
async function generateSupplierCode(tenantId) {
  const query = `
    SELECT COALESCE(MAX(CAST(SUBSTRING(supplier_code FROM 10) AS INTEGER)), 0) + 1 as next_number
    FROM suppliers
    WHERE tenant_id = $1
    AND supplier_code LIKE 'SUP-%'
  `;
  
  try {
    const result = await pool.query(query, [tenantId]);
    const nextNumber = result.rows[0].next_number;
    const year = new Date().getFullYear();
    return `SUP-${year}-${String(nextNumber).padStart(6, '0')}`;
  } catch (error) {
    console.error('Error generating supplier code:', error);
    throw error;
  }
}

/**
 * Create supplier
 */
async function createSupplier(supplierData) {
  const {
    tenant_id,
    name,
    tax_id,
    category_id,
    address,
    city,
    region,
    country,
    phone,
    email,
    website,
    contact_person,
    contact_phone,
    contact_email,
    payment_terms,
    credit_limit,
    bank_name,
    bank_account,
    bank_branch,
    vat_registered,
    vat_registration_number,
    rating,
    notes
  } = supplierData;

  const supplierCode = await generateSupplierCode(tenantId);

  const query = `
    INSERT INTO suppliers 
    (tenant_id, supplier_code, name, tax_id, category_id, address, city, region, country,
     phone, email, website, contact_person, contact_phone, contact_email, payment_terms,
     credit_limit, bank_name, bank_account, bank_branch, vat_registered, vat_registration_number,
     rating, notes)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
    RETURNING *
  `;

  const values = [
    tenant_id,
    supplierCode,
    name,
    tax_id,
    category_id,
    address,
    city,
    region,
    country || 'Ethiopia',
    phone,
    email,
    website,
    contact_person,
    contact_phone,
    contact_email,
    payment_terms || 30,
    credit_limit || 0,
    bank_name,
    bank_account,
    bank_branch,
    vat_registered !== false,
    vat_registration_number,
    rating || 3,
    notes
  ];

  try {
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error('Error creating supplier:', error);
    throw error;
  }
}

/**
 * Get supplier by ID
 */
async function getSupplier(supplierId) {
  const query = `
    SELECT 
      s.*,
      ec.name as category_name,
      ec.code as category_code,
      ec.vat_rate as category_vat_rate,
      ec.withholding_applicable as category_withholding_applicable,
      ec.withholding_rate as category_withholding_rate
    FROM suppliers s
    LEFT JOIN esic_categories ec ON s.category_id = ec.id
    WHERE s.id = $1
  `;
  
  try {
    const result = await pool.query(query, [supplierId]);
    
    if (result.rows.length === 0) {
      throw new Error('Supplier not found');
    }
    
    // Get supplier performance metrics
    const performanceQuery = `
      SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN po.status = 'completed' THEN 1 END) as completed_orders,
        COUNT(CASE WHEN po.status = 'cancelled' THEN 1 END) as cancelled_orders,
        COALESCE(SUM(po.total_amount), 0) as total_purchase_value,
        COALESCE(AVG(po.total_amount), 0) as average_order_value
      FROM purchase_orders po
      WHERE po.supplier_id = $1
    `;
    const performanceResult = await pool.query(performanceQuery, [supplierId]);
    
    return {
      supplier: result.rows[0],
      performance: performanceResult.rows[0]
    };
  } catch (error) {
    console.error('Error getting supplier:', error);
    throw error;
  }
}

/**
 * Get suppliers with filtering
 */
async function getSuppliers(filters) {
  const {
    tenant_id,
    category_id = null,
    vat_registered = null,
    rating = null,
    city = null,
    region = null,
    active = true,
    search = null,
    limit = 100,
    offset = 0
  } = filters;

  let query = `
    SELECT 
      s.*,
      ec.name as category_name,
      ec.code as category_code
    FROM suppliers s
    LEFT JOIN esic_categories ec ON s.category_id = ec.id
    WHERE s.tenant_id = $1 AND s.active = $2
  `;
  const values = [tenant_id, active];
  let paramCount = 2;

  if (category_id) {
    paramCount++;
    query += ` AND s.category_id = $${paramCount}`;
    values.push(category_id);
  }

  if (vat_registered !== null) {
    paramCount++;
    query += ` AND s.vat_registered = $${paramCount}`;
    values.push(vat_registered);
  }

  if (rating) {
    paramCount++;
    query += ` AND s.rating = $${paramCount}`;
    values.push(rating);
  }

  if (city) {
    paramCount++;
    query += ` AND s.city ILIKE $${paramCount}`;
    values.push(`%${city}%`);
  }

  if (region) {
    paramCount++;
    query += ` AND s.region ILIKE $${paramCount}`;
    values.push(`%${region}%`);
  }

  if (search) {
    paramCount++;
    query += ` AND (s.name ILIKE $${paramCount} OR s.supplier_code ILIKE $${paramCount} OR s.contact_person ILIKE $${paramCount})`;
    values.push(`%${search}%`);
  }

  query += ` ORDER BY s.name ASC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
  values.push(limit, offset);

  try {
    const result = await pool.query(query, values);
    return result.rows;
  } catch (error) {
    console.error('Error getting suppliers:', error);
    throw error;
  }
}

/**
 * Get suppliers by category
 */
async function getSuppliersByCategory(tenantId, categoryId) {
  const query = `
    SELECT 
      s.*,
      ec.name as category_name,
      ec.code as category_code
    FROM suppliers s
    LEFT JOIN esic_categories ec ON s.category_id = ec.id
    WHERE s.tenant_id = $1 AND s.category_id = $2 AND s.active = true
    ORDER BY s.name ASC
  `;
  
  try {
    const result = await pool.query(query, [tenantId, categoryId]);
    return result.rows;
  } catch (error) {
    console.error('Error getting suppliers by category:', error);
    throw error;
  }
}

/**
 * Search suppliers
 */
async function searchSuppliers(tenantId, searchTerm) {
  const query = `
    SELECT 
      s.*,
      ec.name as category_name,
      ec.code as category_code
    FROM suppliers s
    LEFT JOIN esic_categories ec ON s.category_id = ec.id
    WHERE s.tenant_id = $1 
      AND s.active = true
      AND (s.name ILIKE $2 OR s.supplier_code ILIKE $2 OR s.contact_person ILIKE $2 OR s.email ILIKE $2)
    ORDER BY 
      CASE 
        WHEN s.name ILIKE $2 THEN 1
        WHEN s.supplier_code ILIKE $2 THEN 2
        WHEN s.contact_person ILIKE $2 THEN 3
        ELSE 4
      END,
      s.name ASC
    LIMIT 50
  `;
  
  try {
    const result = await pool.query(query, [tenantId, `%${searchTerm}%`]);
    return result.rows;
  } catch (error) {
    console.error('Error searching suppliers:', error);
    throw error;
  }
}

/**
 * Update supplier
 */
async function updateSupplier(supplierId, updateData) {
  const {
    name,
    tax_id,
    category_id,
    address,
    city,
    region,
    country,
    phone,
    email,
    website,
    contact_person,
    contact_phone,
    contact_email,
    payment_terms,
    credit_limit,
    bank_name,
    bank_account,
    bank_branch,
    vat_registered,
    vat_registration_number,
    rating,
    notes,
    active
  } = updateData;

  const query = `
    UPDATE suppliers
    SET name = COALESCE($1, name),
        tax_id = COALESCE($2, tax_id),
        category_id = COALESCE($3, category_id),
        address = COALESCE($4, address),
        city = COALESCE($5, city),
        region = COALESCE($6, region),
        country = COALESCE($7, country),
        phone = COALESCE($8, phone),
        email = COALESCE($9, email),
        website = COALESCE($10, website),
        contact_person = COALESCE($11, contact_person),
        contact_phone = COALESCE($12, contact_phone),
        contact_email = COALESCE($13, contact_email),
        payment_terms = COALESCE($14, payment_terms),
        credit_limit = COALESCE($15, credit_limit),
        bank_name = COALESCE($16, bank_name),
        bank_account = COALESCE($17, bank_account),
        bank_branch = COALESCE($18, bank_branch),
        vat_registered = COALESCE($19, vat_registered),
        vat_registration_number = COALESCE($20, vat_registration_number),
        rating = COALESCE($21, rating),
        notes = COALESCE($22, notes),
        active = COALESCE($23, active)
    WHERE id = $24
    RETURNING *
  `;

  const values = [
    name,
    tax_id,
    category_id,
    address,
    city,
    region,
    country,
    phone,
    email,
    website,
    contact_person,
    contact_phone,
    contact_email,
    payment_terms,
    credit_limit,
    bank_name,
    bank_account,
    bank_branch,
    vat_registered,
    vat_registration_number,
    rating,
    notes,
    active,
    supplierId
  ];

  try {
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      throw new Error('Supplier not found');
    }
    
    return result.rows[0];
  } catch (error) {
    console.error('Error updating supplier:', error);
    throw error;
  }
}

/**
 * Delete supplier (soft delete)
 */
async function deleteSupplier(supplierId) {
  const query = `
    UPDATE suppliers
    SET active = false
    WHERE id = $1
    RETURNING *
  `;
  
  try {
    const result = await pool.query(query, [supplierId]);
    
    if (result.rows.length === 0) {
      throw new Error('Supplier not found');
    }
    
    return result.rows[0];
  } catch (error) {
    console.error('Error deleting supplier:', error);
    throw error;
  }
}

/**
 * Get supplier categories
 */
async function getSupplierCategories(tenantId) {
  const query = `
    SELECT DISTINCT
      ec.id,
      ec.code,
      ec.name,
      ec.level,
      COUNT(s.id) as supplier_count
    FROM esic_categories ec
    LEFT JOIN suppliers s ON ec.id = s.category_id AND s.tenant_id = $1 AND s.active = true
    WHERE ec.active = true
    GROUP BY ec.id, ec.code, ec.name, ec.level
    HAVING COUNT(s.id) > 0
    ORDER BY ec.code ASC
  `;
  
  try {
    const result = await pool.query(query, [tenantId]);
    return result.rows;
  } catch (error) {
    console.error('Error getting supplier categories:', error);
    throw error;
  }
}

/**
 * Get supplier performance report
 */
async function getSupplierPerformanceReport(tenantId, startDate, endDate) {
  const query = `
    SELECT 
      s.id,
      s.supplier_code,
      s.name,
      s.category_id,
      ec.name as category_name,
      COUNT(po.id) as total_orders,
      COUNT(CASE WHEN po.status = 'completed' THEN 1 END) as completed_orders,
      COUNT(CASE WHEN po.status = 'cancelled' THEN 1 END) as cancelled_orders,
      COUNT(CASE WHEN po.status = 'pending' THEN 1 END) as pending_orders,
      COALESCE(SUM(po.total_amount), 0) as total_purchase_value,
      COALESCE(AVG(po.total_amount), 0) as average_order_value,
      COALESCE(MIN(po.total_amount), 0) as minimum_order_value,
      COALESCE(MAX(po.total_amount), 0) as maximum_order_value,
      COUNT(CASE WHEN po.sent_to_supplier = true THEN 1 END) as orders_sent,
      COUNT(CASE WHEN po.supplier_acknowledged = true THEN 1 END) as orders_acknowledged
    FROM suppliers s
    LEFT JOIN esic_categories ec ON s.category_id = ec.id
    LEFT JOIN purchase_orders po ON s.id = po.supplier_id 
      AND po.tenant_id = s.tenant_id
      AND po.po_date >= $2
      AND po.po_date <= $3
    WHERE s.tenant_id = $1 AND s.active = true
    GROUP BY s.id, s.supplier_code, s.name, s.category_id, ec.name
    ORDER BY total_purchase_value DESC
  `;
  
  try {
    const result = await pool.query(query, [tenantId, startDate, endDate]);
    return result.rows;
  } catch (error) {
    console.error('Error getting supplier performance report:', error);
    throw error;
  }
}

/**
 * Validate supplier for category
 */
async function validateSupplierForCategory(supplierId, categoryId) {
  const query = `
    SELECT 
      s.*,
      ec.name as category_name,
      ec.code as category_code,
      ec.vat_rate as category_vat_rate,
      ec.withholding_applicable as category_withholding_applicable,
      ec.withholding_rate as category_withholding_rate
    FROM suppliers s
    LEFT JOIN esic_categories ec ON s.category_id = ec.id
    WHERE s.id = $1 AND s.active = true
  `;
  
  try {
    const result = await pool.query(query, [supplierId]);
    
    if (result.rows.length === 0) {
      return {
        valid: false,
        message: 'Supplier not found or inactive'
      };
    }
    
    const supplier = result.rows[0];
    
    // Check if supplier category matches requested category
    if (supplier.category_id !== categoryId) {
      return {
        valid: true,
        message: 'Supplier category differs from requested category',
        supplier_category: supplier.category_name,
        requested_category_id: categoryId,
        warning: true
      };
    }
    
    return {
      valid: true,
      message: 'Supplier is valid for this category',
      supplier: supplier
    };
  } catch (error) {
    console.error('Error validating supplier for category:', error);
    throw error;
  }
}

/**
 * Update supplier rating
 */
async function updateSupplierRating(supplierId, rating, reason) {
  const query = `
    UPDATE suppliers
    SET rating = $1
    WHERE id = $2
    RETURNING *
  `;
  
  try {
    const result = await pool.query(query, [rating, supplierId]);
    
    if (result.rows.length === 0) {
      throw new Error('Supplier not found');
    }
    
    // Log rating change
    const logQuery = `
      INSERT INTO purchase_comments 
      (tenant_id, comment_type, reference_type, reference_id, comment_text, commented_by, commented_by_name, is_internal)
      VALUES ($1, 'rating_change', 'supplier', $2, $3, 'system', 'System', true)
    `;
    
    await pool.query(logQuery, [
      result.rows[0].tenant_id,
      supplierId,
      `Rating updated to ${rating}. Reason: ${reason}`
    ]);
    
    return result.rows[0];
  } catch (error) {
    console.error('Error updating supplier rating:', error);
    throw error;
  }
}

module.exports = {
  createSupplier,
  getSupplier,
  getSuppliers,
  getSuppliersByCategory,
  searchSuppliers,
  updateSupplier,
  deleteSupplier,
  getSupplierCategories,
  getSupplierPerformanceReport,
  validateSupplierForCategory,
  updateSupplierRating
};
