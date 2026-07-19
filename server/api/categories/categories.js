/**
 * ESIC Category Management API
 * Provides category classification system for Ethiopian Standard Industrial Classification
 */

const { Pool } = require('pg');

// Database connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

/**
 * Get all ESIC categories with optional filtering
 */
async function getCategories(filters = {}) {
  const {
    level = null,
    parent_id = null,
    tax_applicable = null,
    active = true,
    search = null
  } = filters;

  let query = `
    SELECT 
      c.*,
      p.name as parent_name,
      p.code as parent_code
    FROM esic_categories c
    LEFT JOIN esic_categories p ON c.parent_id = p.id
    WHERE c.active = $1
  `;
  const values = [active];
  let paramCount = 1;

  if (level) {
    paramCount++;
    query += ` AND c.level = $${paramCount}`;
    values.push(level);
  }

  if (parent_id !== null) {
    paramCount++;
    query += ` AND c.parent_id = $${paramCount}`;
    values.push(parent_id);
  }

  if (tax_applicable !== null) {
    paramCount++;
    query += ` AND c.tax_applicable = $${paramCount}`;
    values.push(tax_applicable);
  }

  if (search) {
    paramCount++;
    query += ` AND (c.name ILIKE $${paramCount} OR c.code ILIKE $${paramCount})`;
    values.push(`%${search}%`);
  }

  query += ` ORDER BY c.code ASC`;

  try {
    const result = await pool.query(query, values);
    return result.rows;
  } catch (error) {
    console.error('Error getting categories:', error);
    throw error;
  }
}

/**
 * Get category by code
 */
async function getCategoryByCode(code) {
  const query = `
    SELECT 
      c.*,
      p.name as parent_name,
      p.code as parent_code
    FROM esic_categories c
    LEFT JOIN esic_categories p ON c.parent_id = p.id
    WHERE c.code = $1
  `;

  try {
    const result = await pool.query(query, [code]);
    
    if (result.rows.length === 0) {
      throw new Error('Category not found');
    }
    
    return result.rows[0];
  } catch (error) {
    console.error('Error getting category by code:', error);
    throw error;
  }
}

/**
 * Get category hierarchy tree
 */
async function getCategoryHierarchy() {
  const query = `
    WITH RECURSIVE category_tree AS (
      SELECT 
        id, code, name, parent_id, level, description, 
        tax_applicable, vat_rate, vat_exempt, 
        withholding_applicable, withholding_rate, active,
        name as path_name, code as path_code
      FROM esic_categories
      WHERE parent_id IS NULL
      
      UNION ALL
      
      SELECT 
        c.id, c.code, c.name, c.parent_id, c.level, c.description,
        c.tax_applicable, c.vat_rate, c.vat_exempt,
        c.withholding_applicable, c.withholding_rate, c.active,
        ct.path_name || ' > ' || c.name as path_name,
        ct.path_code || ' > ' || c.code as path_code
      FROM esic_categories c
      INNER JOIN category_tree ct ON c.parent_id = ct.id
    )
    SELECT * FROM category_tree
    WHERE active = true
    ORDER BY code, level
  `;

  try {
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error('Error getting category hierarchy:', error);
    throw error;
  }
}

/**
 * Get categories by level (for dropdown menus)
 */
async function getCategoriesByLevel(level) {
  const query = `
    SELECT 
      id, code, name, parent_id, level,
      tax_applicable, vat_rate, withholding_applicable, withholding_rate
    FROM esic_categories
    WHERE level = $1 AND active = true
    ORDER BY code ASC
  `;

  try {
    const result = await pool.query(query, [level]);
    return result.rows;
  } catch (error) {
    console.error('Error getting categories by level:', error);
    throw error;
  }
}

/**
 * Get child categories of a parent
 */
async function getChildCategories(parentCode) {
  const query = `
    SELECT 
      c.*,
      p.name as parent_name
    FROM esic_categories c
    INNER JOIN esic_categories p ON c.parent_id = p.id
    WHERE p.code = $1 AND c.active = true
    ORDER BY c.code ASC
  `;

  try {
    const result = await pool.query(query, [parentCode]);
    return result.rows;
  } catch (error) {
    console.error('Error getting child categories:', error);
    throw error;
  }
}

/**
 * Search categories by name or code
 */
async function searchCategories(searchTerm) {
  const query = `
    SELECT 
      id, code, name, parent_id, level, description,
      tax_applicable, vat_rate, withholding_applicable, withholding_rate
    FROM esic_categories
    WHERE (name ILIKE $1 OR code ILIKE $1) AND active = true
    ORDER BY 
      CASE 
        WHEN code ILIKE $1 THEN 1
        WHEN name ILIKE $1 THEN 2
        ELSE 3
      END,
      code ASC
    LIMIT 50
  `;

  try {
    const result = await pool.query(query, [`%${searchTerm}%`]);
    return result.rows;
  } catch (error) {
    console.error('Error searching categories:', error);
    throw error;
  }
}

/**
 * Get tax-applicable categories
 */
async function getTaxApplicableCategories() {
  const query = `
    SELECT 
      id, code, name, parent_id, level,
      vat_rate, vat_exempt, withholding_applicable, withholding_rate,
      excise_applicable, excise_rate
    FROM esic_categories
    WHERE tax_applicable = true AND active = true
    ORDER BY code ASC
  `;

  try {
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error('Error getting tax-applicable categories:', error);
    throw error;
  }
}

/**
 * Get categories with specific VAT rate
 */
async function getCategoriesByVatRate(vatRate) {
  const query = `
    SELECT 
      id, code, name, parent_id, level, vat_rate, vat_exempt
    FROM esic_categories
    WHERE vat_rate = $1 AND tax_applicable = true AND active = true
    ORDER BY code ASC
  `;

  try {
    const result = await pool.query(query, [vatRate]);
    return result.rows;
  } catch (error) {
    console.error('Error getting categories by VAT rate:', error);
    throw error;
  }
}

/**
 * Get exempt categories
 */
async function getExemptCategories() {
  const query = `
    SELECT 
      id, code, name, parent_id, level, vat_exempt
    FROM esic_categories
    WHERE vat_exempt = true AND active = true
    ORDER BY code ASC
  `;

  try {
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error('Error getting exempt categories:', error);
    throw error;
  }
}

/**
 * Validate category code
 */
async function validateCategoryCode(code) {
  const query = `
    SELECT id, code, name, level, tax_applicable, vat_rate, withholding_applicable, withholding_rate
    FROM esic_categories
    WHERE code = $1 AND active = true
  `;

  try {
    const result = await pool.query(query, [code]);
    
    if (result.rows.length === 0) {
      return { valid: false, message: 'Category code not found' };
    }
    
    const category = result.rows[0];
    return {
      valid: true,
      category: category,
      message: 'Category code is valid'
    };
  } catch (error) {
    console.error('Error validating category code:', error);
    throw error;
  }
}

/**
 * Get category statistics
 */
async function getCategoryStatistics() {
  const query = `
    SELECT 
      level,
      COUNT(*) as total_categories,
      COUNT(CASE WHEN tax_applicable = true THEN 1 END) as tax_applicable,
      COUNT(CASE WHEN vat_exempt = true THEN 1 END) as vat_exempt,
      COUNT(CASE WHEN withholding_applicable = true THEN 1 END) as withholding_applicable,
      COUNT(CASE WHEN excise_applicable = true THEN 1 END) as excise_applicable
    FROM esic_categories
    WHERE active = true
    GROUP BY level
    ORDER BY level
  `;

  try {
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error('Error getting category statistics:', error);
    throw error;
  }
}

module.exports = {
  getCategories,
  getCategoryByCode,
  getCategoryHierarchy,
  getCategoriesByLevel,
  getChildCategories,
  searchCategories,
  getTaxApplicableCategories,
  getCategoriesByVatRate,
  getExemptCategories,
  validateCategoryCode,
  getCategoryStatistics
};
