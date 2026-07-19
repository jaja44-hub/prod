/**
 * ESIC Categories API Router
 * Express router for category management endpoints
 */

const express = require('express');
const router = express.Router();
const {
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
} = require('./categories');

/**
 * GET /api/categories
 * Get all categories with optional filtering
 */
router.get('/', async (req, res) => {
  try {
    const filters = {
      level: req.query.level ? parseInt(req.query.level) : null,
      parent_id: req.query.parent_id ? parseInt(req.query.parent_id) : null,
      tax_applicable: req.query.tax_applicable === 'true' ? true : 
                     req.query.tax_applicable === 'false' ? false : null,
      active: req.query.active === 'false' ? false : true,
      search: req.query.search || null
    };
    
    const categories = await getCategories(filters);
    res.json({
      success: true,
      data: categories,
      count: categories.length
    });
  } catch (error) {
    console.error('Error getting categories:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/categories/hierarchy
 * Get complete category hierarchy tree
 */
router.get('/hierarchy', async (req, res) => {
  try {
    const hierarchy = await getCategoryHierarchy();
    res.json({
      success: true,
      data: hierarchy,
      count: hierarchy.length
    });
  } catch (error) {
    console.error('Error getting category hierarchy:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/categories/level/:level
 * Get categories by level
 */
router.get('/level/:level', async (req, res) => {
  try {
    const level = parseInt(req.params.level);
    const categories = await getCategoriesByLevel(level);
    res.json({
      success: true,
      data: categories,
      count: categories.length
    });
  } catch (error) {
    console.error('Error getting categories by level:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/categories/parent/:parentCode
 * Get child categories of a parent
 */
router.get('/parent/:parentCode', async (req, res) => {
  try {
    const children = await getChildCategories(req.params.parentCode);
    res.json({
      success: true,
      data: children,
      count: children.length
    });
  } catch (error) {
    console.error('Error getting child categories:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/categories/search/:term
 * Search categories by name or code
 */
router.get('/search/:term', async (req, res) => {
  try {
    const results = await searchCategories(req.params.term);
    res.json({
      success: true,
      data: results,
      count: results.length
    });
  } catch (error) {
    console.error('Error searching categories:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/categories/tax-applicable
 * Get tax-applicable categories
 */
router.get('/tax-applicable', async (req, res) => {
  try {
    const categories = await getTaxApplicableCategories();
    res.json({
      success: true,
      data: categories,
      count: categories.length
    });
  } catch (error) {
    console.error('Error getting tax-applicable categories:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/categories/vat-rate/:rate
 * Get categories by VAT rate
 */
router.get('/vat-rate/:rate', async (req, res) => {
  try {
    const rate = parseFloat(req.params.rate);
    const categories = await getCategoriesByVatRate(rate);
    res.json({
      success: true,
      data: categories,
      count: categories.length
    });
  } catch (error) {
    console.error('Error getting categories by VAT rate:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/categories/exempt
 * Get VAT-exempt categories
 */
router.get('/exempt', async (req, res) => {
  try {
    const categories = await getExemptCategories();
    res.json({
      success: true,
      data: categories,
      count: categories.length
    });
  } catch (error) {
    console.error('Error getting exempt categories:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/categories/validate/:code
 * Validate a category code
 */
router.get('/validate/:code', async (req, res) => {
  try {
    const validation = await validateCategoryCode(req.params.code);
    res.json({
      success: true,
      data: validation
    });
  } catch (error) {
    console.error('Error validating category code:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/categories/code/:code
 * Get category by code
 */
router.get('/code/:code', async (req, res) => {
  try {
    const category = await getCategoryByCode(req.params.code);
    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Error getting category by code:', error);
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/categories/statistics
 * Get category statistics
 */
router.get('/statistics', async (req, res) => {
  try {
    const statistics = await getCategoryStatistics();
    res.json({
      success: true,
      data: statistics
    });
  } catch (error) {
    console.error('Error getting category statistics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
