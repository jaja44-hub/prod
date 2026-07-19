/**
 * Purchase Module API Router
 * Express router for purchase-related endpoints
 */

const express = require('express');
const router = express.Router();
const {
  createRequisition,
  validateBudget,
  submitRequisition,
  approveRequisition,
  rejectRequisition,
  getRequisition,
  getRequisitions,
  updateRequisition,
  deleteRequisition
} = require('./requisitions');

const {
  createPOFromRequisition,
  createPO,
  submitPO,
  approvePO,
  sendPOToSupplier,
  acknowledgePO,
  getPO,
  getPOs,
  updatePO,
  deletePO
} = require('./orders');

const {
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
} = require('./suppliers');

const {
  createReceiptFromPO,
  processReceipt,
  getReceipt,
  getReceipts
} = require('./receipts');

const {
  checkBudgetAvailability,
  createBudgetCommitment,
  releaseBudgetCommitment,
  getBudgetCommitments,
  getBudgetByCategory,
  validateRequisitionBudget,
  validatePOBudget,
  getBudgetUtilizationReport
} = require('./budget');

// ============================================
// Purchase Requisition Endpoints
// ============================================

/**
 * POST /api/purchase/requisitions
 * Create purchase requisition
 */
router.post('/requisitions', async (req, res) => {
  try {
    const { tenant_id, ...requisitionData } = req.body;
    
    if (!tenant_id) {
      return res.status(400).json({
        success: false,
        error: 'tenant_id is required'
      });
    }
    
    const requisition = await createRequisition({ tenant_id, ...requisitionData });
    res.status(201).json({
      success: true,
      data: requisition
    });
  } catch (error) {
    console.error('Error creating requisition:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/purchase/requisitions/:id/validate-budget
 * Validate budget for requisition
 */
router.post('/requisitions/:id/validate-budget', async (req, res) => {
  try {
    const { id } = req.params;
    const { budget_id } = req.body;
    
    const validation = await validateBudget(parseInt(id), budget_id ? parseInt(budget_id) : null);
    res.json({
      success: true,
      data: validation
    });
  } catch (error) {
    console.error('Error validating budget:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/purchase/requisitions/:id/submit
 * Submit requisition for approval
 */
router.post('/requisitions/:id/submit', async (req, res) => {
  try {
    const { id } = req.params;
    const { submitter_id, submitter_name } = req.body;
    
    const requisition = await submitRequisition(parseInt(id), { submitter_id, submitter_name });
    res.json({
      success: true,
      data: requisition
    });
  } catch (error) {
    console.error('Error submitting requisition:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/purchase/requisitions/:id/approve
 * Approve requisition
 */
router.post('/requisitions/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const approverData = req.body;
    
    const requisition = await approveRequisition(parseInt(id), approverData);
    res.json({
      success: true,
      data: requisition
    });
  } catch (error) {
    console.error('Error approving requisition:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/purchase/requisitions/:id/reject
 * Reject requisition
 */
router.post('/requisitions/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const rejectorData = req.body;
    
    const requisition = await rejectRequisition(parseInt(id), rejectorData);
    res.json({
      success: true,
      data: requisition
    });
  } catch (error) {
    console.error('Error rejecting requisition:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/purchase/requisitions/:id
 * Get requisition by ID
 */
router.get('/requisitions/:id', async (req, res) => {
  try {
    const requisition = await getRequisition(parseInt(req.params.id));
    res.json({
      success: true,
      data: requisition
    });
  } catch (error) {
    console.error('Error getting requisition:', error);
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/purchase/requisitions
 * Get requisitions with filtering
 */
router.get('/requisitions', async (req, res) => {
  try {
    const filters = {
      tenant_id: req.query.tenant_id,
      status: req.query.status,
      requested_by: req.query.requested_by,
      category_id: req.query.category_id ? parseInt(req.query.category_id) : null,
      budget_id: req.query.budget_id ? parseInt(req.query.budget_id) : null,
      start_date: req.query.start_date,
      end_date: req.query.end_date,
      limit: req.query.limit ? parseInt(req.query.limit) : 100,
      offset: req.query.offset ? parseInt(req.query.offset) : 0
    };
    
    const requisitions = await getRequisitions(filters);
    res.json({
      success: true,
      data: requisitions,
      count: requisitions.length
    });
  } catch (error) {
    console.error('Error getting requisitions:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/purchase/requisitions/:id
 * Update requisition
 */
router.put('/requisitions/:id', async (req, res) => {
  try {
    const requisition = await updateRequisition(parseInt(req.params.id), req.body);
    res.json({
      success: true,
      data: requisition
    });
  } catch (error) {
    console.error('Error updating requisition:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/purchase/requisitions/:id
 * Delete requisition
 */
router.delete('/requisitions/:id', async (req, res) => {
  try {
    const requisition = await deleteRequisition(parseInt(req.params.id));
    res.json({
      success: true,
      data: requisition
    });
  } catch (error) {
    console.error('Error deleting requisition:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// Purchase Order Endpoints
// ============================================

/**
 * POST /api/purchase/orders/from-requisition/:requisitionId
 * Create PO from requisition
 */
router.post('/orders/from-requisition/:requisitionId', async (req, res) => {
  try {
    const po = await createPOFromRequisition(parseInt(req.params.requisitionId), req.body);
    res.status(201).json({
      success: true,
      data: po
    });
  } catch (error) {
    console.error('Error creating PO from requisition:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/purchase/orders
 * Create standalone PO
 */
router.post('/orders', async (req, res) => {
  try {
    const po = await createPO(req.body);
    res.status(201).json({
      success: true,
      data: po
    });
  } catch (error) {
    console.error('Error creating PO:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/purchase/orders/:id/submit
 * Submit PO for approval
 */
router.post('/orders/:id/submit', async (req, res) => {
  try {
    const { submitter_id, submitter_name } = req.body;
    const po = await submitPO(parseInt(req.params.id), { submitter_id, submitter_name });
    res.json({
      success: true,
      data: po
    });
  } catch (error) {
    console.error('Error submitting PO:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/purchase/orders/:id/approve
 * Approve PO
 */
router.post('/orders/:id/approve', async (req, res) => {
  try {
    const approverData = req.body;
    const po = await approvePO(parseInt(req.params.id), approverData);
    res.json({
      success: true,
      data: po
    });
  } catch (error) {
    console.error('Error approving PO:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/purchase/orders/:id/send
 * Send PO to supplier
 */
router.post('/orders/:id/send', async (req, res) => {
  try {
    const { sender_id, sender_name } = req.body;
    const po = await sendPOToSupplier(parseInt(req.params.id), { sender_id, sender_name });
    res.json({
      success: true,
      data: po
    });
  } catch (error) {
    console.error('Error sending PO to supplier:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/purchase/orders/:id/acknowledge
 * Acknowledge PO receipt
 */
router.post('/orders/:id/acknowledge', async (req, res) => {
  try {
    const po = await acknowledgePO(parseInt(req.params.id));
    res.json({
      success: true,
      data: po
    });
  } catch (error) {
    console.error('Error acknowledging PO:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/purchase/orders/:id
 * Get PO by ID
 */
router.get('/orders/:id', async (req, res) => {
  try {
    const po = await getPO(parseInt(req.params.id));
    res.json({
      success: true,
      data: po
    });
  } catch (error) {
    console.error('Error getting PO:', error);
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/purchase/orders
 * Get POs with filtering
 */
router.get('/orders', async (req, res) => {
  try {
    const filters = {
      tenant_id: req.query.tenant_id,
      status: req.query.status,
      supplier_id: req.query.supplier_id ? parseInt(req.query.supplier_id) : null,
      category_id: req.query.category_id ? parseInt(req.query.category_id) : null,
      requisition_id: req.query.requisition_id ? parseInt(req.query.requisition_id) : null,
      start_date: req.query.start_date,
      end_date: req.query.end_date,
      limit: req.query.limit ? parseInt(req.query.limit) : 100,
      offset: req.query.offset ? parseInt(req.query.offset) : 0
    };
    
    const pos = await getPOs(filters);
    res.json({
      success: true,
      data: pos,
      count: pos.length
    });
  } catch (error) {
    console.error('Error getting POs:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/purchase/orders/:id
 * Update PO
 */
router.put('/orders/:id', async (req, res) => {
  try {
    const po = await updatePO(parseInt(req.params.id), req.body);
    res.json({
      success: true,
      data: po
    });
  } catch (error) {
    console.error('Error updating PO:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/purchase/orders/:id
 * Delete PO
 */
router.delete('/orders/:id', async (req, res) => {
  try {
    const po = await deletePO(parseInt(req.params.id));
    res.json({
      success: true,
      data: po
    });
  } catch (error) {
    console.error('Error deleting PO:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// Supplier Endpoints
// ============================================

/**
 * POST /api/purchase/suppliers
 * Create supplier
 */
router.post('/suppliers', async (req, res) => {
  try {
    const supplier = await createSupplier(req.body);
    res.status(201).json({
      success: true,
      data: supplier
    });
  } catch (error) {
    console.error('Error creating supplier:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/purchase/suppliers/:id
 * Get supplier by ID
 */
router.get('/suppliers/:id', async (req, res) => {
  try {
    const supplier = await getSupplier(parseInt(req.params.id));
    res.json({
      success: true,
      data: supplier
    });
  } catch (error) {
    console.error('Error getting supplier:', error);
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/purchase/suppliers
 * Get suppliers with filtering
 */
router.get('/suppliers', async (req, res) => {
  try {
    const filters = {
      tenant_id: req.query.tenant_id,
      category_id: req.query.category_id ? parseInt(req.query.category_id) : null,
      vat_registered: req.query.vat_registered === 'true' ? true : 
                     req.query.vat_registered === 'false' ? false : null,
      rating: req.query.rating ? parseInt(req.query.rating) : null,
      city: req.query.city,
      region: req.query.region,
      active: req.query.active === 'false' ? false : true,
      search: req.query.search,
      limit: req.query.limit ? parseInt(req.query.limit) : 100,
      offset: req.query.offset ? parseInt(req.query.offset) : 0
    };
    
    const suppliers = await getSuppliers(filters);
    res.json({
      success: true,
      data: suppliers,
      count: suppliers.length
    });
  } catch (error) {
    console.error('Error getting suppliers:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/purchase/suppliers/category/:categoryId
 * Get suppliers by category
 */
router.get('/suppliers/category/:categoryId', async (req, res) => {
  try {
    const suppliers = await getSuppliersByCategory(
      req.query.tenant_id,
      parseInt(req.params.categoryId)
    );
    res.json({
      success: true,
      data: suppliers,
      count: suppliers.length
    });
  } catch (error) {
    console.error('Error getting suppliers by category:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/purchase/suppliers/search/:term
 * Search suppliers
 */
router.get('/suppliers/search/:term', async (req, res) => {
  try {
    const suppliers = await searchSuppliers(req.query.tenant_id, req.params.term);
    res.json({
      success: true,
      data: suppliers,
      count: suppliers.length
    });
  } catch (error) {
    console.error('Error searching suppliers:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/purchase/suppliers/:id
 * Update supplier
 */
router.put('/suppliers/:id', async (req, res) => {
  try {
    const supplier = await updateSupplier(parseInt(req.params.id), req.body);
    res.json({
      success: true,
      data: supplier
    });
  } catch (error) {
    console.error('Error updating supplier:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/purchase/suppliers/:id
 * Delete supplier (soft delete)
 */
router.delete('/suppliers/:id', async (req, res) => {
  try {
    const supplier = await deleteSupplier(parseInt(req.params.id));
    res.json({
      success: true,
      data: supplier
    });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/purchase/suppliers-categories
 * Get supplier categories
 */
router.get('/suppliers-categories', async (req, res) => {
  try {
    const categories = await getSupplierCategories(req.query.tenant_id);
    res.json({
      success: true,
      data: categories,
      count: categories.length
    });
  } catch (error) {
    console.error('Error getting supplier categories:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/purchase/suppliers-performance
 * Get supplier performance report
 */
router.get('/suppliers-performance', async (req, res) => {
  try {
    const report = await getSupplierPerformanceReport(
      req.query.tenant_id,
      req.query.start_date,
      req.query.end_date
    );
    res.json({
      success: true,
      data: report,
      count: report.length
    });
  } catch (error) {
    console.error('Error getting supplier performance report:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/purchase/suppliers/:id/validate-category
 * Validate supplier for category
 */
router.post('/suppliers/:id/validate-category', async (req, res) => {
  try {
    const { category_id } = req.body;
    const validation = await validateSupplierForCategory(
      parseInt(req.params.id),
      parseInt(category_id)
    );
    res.json({
      success: true,
      data: validation
    });
  } catch (error) {
    console.error('Error validating supplier for category:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/purchase/suppliers/:id/rating
 * Update supplier rating
 */
router.put('/suppliers/:id/rating', async (req, res) => {
  try {
    const { rating, reason } = req.body;
    const supplier = await updateSupplierRating(parseInt(req.params.id), rating, reason);
    res.json({
      success: true,
      data: supplier
    });
  } catch (error) {
    console.error('Error updating supplier rating:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// Receipt Endpoints
// ============================================

/**
 * POST /api/purchase/receipts/from-po/:poId
 * Create receipt from PO
 */
router.post('/receipts/from-po/:poId', async (req, res) => {
  try {
    const receipt = await createReceiptFromPO(parseInt(req.params.poId), req.body);
    res.status(201).json({
      success: true,
      data: receipt
    });
  } catch (error) {
    console.error('Error creating receipt from PO:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/purchase/receipts/:id/process
 * Process receipt (quality inspection)
 */
router.post('/receipts/:id/process', async (req, res) => {
  try {
    const receipt = await processReceipt(parseInt(req.params.id), req.body);
    res.json({
      success: true,
      data: receipt
    });
  } catch (error) {
    console.error('Error processing receipt:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/purchase/receipts/:id
 * Get receipt by ID
 */
router.get('/receipts/:id', async (req, res) => {
  try {
    const receipt = await getReceipt(parseInt(req.params.id));
    res.json({
      success: true,
      data: receipt
    });
  } catch (error) {
    console.error('Error getting receipt:', error);
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/purchase/receipts
 * Get receipts with filtering
 */
router.get('/receipts', async (req, res) => {
  try {
    const filters = {
      tenant_id: req.query.tenant_id,
      po_id: req.query.po_id ? parseInt(req.query.po_id) : null,
      status: req.query.status,
      category_id: req.query.category_id ? parseInt(req.query.category_id) : null,
      received_by: req.query.received_by,
      start_date: req.query.start_date,
      end_date: req.query.end_date,
      limit: req.query.limit ? parseInt(req.query.limit) : 100,
      offset: req.query.offset ? parseInt(req.query.offset) : 0
    };
    
    const receipts = await getReceipts(filters);
    res.json({
      success: true,
      data: receipts,
      count: receipts.length
    });
  } catch (error) {
    console.error('Error getting receipts:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// Budget Endpoints
// ============================================

/**
 * POST /api/purchase/budget/check-availability
 * Check budget availability
 */
router.post('/budget/check-availability', async (req, res) => {
  try {
    const { budget_id, required_amount } = req.body;
    const check = await checkBudgetAvailability(parseInt(budget_id), parseFloat(required_amount));
    res.json({
      success: true,
      data: check
    });
  } catch (error) {
    console.error('Error checking budget availability:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/purchase/budget/commitments
 * Create budget commitment
 */
router.post('/budget/commitments', async (req, res) => {
  try {
    const commitment = await createBudgetCommitment(req.body);
    res.status(201).json({
      success: true,
      data: commitment
    });
  } catch (error) {
    console.error('Error creating budget commitment:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/purchase/budget/commitments/:id/release
 * Release budget commitment
 */
router.post('/budget/commitments/:id/release', async (req, res) => {
  try {
    const commitment = await releaseBudgetCommitment(parseInt(req.params.id), req.body);
    res.json({
      success: true,
      data: commitment
    });
  } catch (error) {
    console.error('Error releasing budget commitment:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/purchase/budget/commitments
 * Get budget commitments
 */
router.get('/budget/commitments', async (req, res) => {
  try {
    const filters = {
      tenant_id: req.query.tenant_id,
      budget_id: req.query.budget_id ? parseInt(req.query.budget_id) : null,
      commitment_type: req.query.commitment_type,
      reference_type: req.query.reference_type,
      reference_id: req.query.reference_id ? parseInt(req.query.reference_id) : null,
      status: req.query.status,
      start_date: req.query.start_date,
      end_date: req.query.end_date,
      limit: req.query.limit ? parseInt(req.query.limit) : 100,
      offset: req.query.offset ? parseInt(req.query.offset) : 0
    };
    
    const commitments = await getBudgetCommitments(filters);
    res.json({
      success: true,
      data: commitments,
      count: commitments.length
    });
  } catch (error) {
    console.error('Error getting budget commitments:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/purchase/budget/category/:categoryId
 * Get budget by category
 */
router.get('/budget/category/:categoryId', async (req, res) => {
  try {
    const budget = await getBudgetByCategory(
      req.query.tenant_id,
      parseInt(req.params.categoryId),
      req.query.fiscal_year,
      req.query.fiscal_period
    );
    
    if (!budget) {
      return res.status(404).json({
        success: false,
        error: 'Budget not found'
      });
    }
    
    res.json({
      success: true,
      data: budget
    });
  } catch (error) {
    console.error('Error getting budget by category:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/purchase/budget/requisitions/:id/validate
 * Validate requisition budget
 */
router.post('/budget/requisitions/:id/validate', async (req, res) => {
  try {
    const validation = await validateRequisitionBudget(parseInt(req.params.id));
    res.json({
      success: true,
      data: validation
    });
  } catch (error) {
    console.error('Error validating requisition budget:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/purchase/budget/orders/:id/validate
 * Validate PO budget
 */
router.post('/budget/orders/:id/validate', async (req, res) => {
  try {
    const validation = await validatePOBudget(parseInt(req.params.id));
    res.json({
      success: true,
      data: validation
    });
  } catch (error) {
    console.error('Error validating PO budget:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/purchase/budget/utilization
 * Get budget utilization report
 */
router.get('/budget/utilization', async (req, res) => {
  try {
    const report = await getBudgetUtilizationReport(
      req.query.tenant_id,
      req.query.fiscal_year,
      req.query.fiscal_period
    );
    res.json({
      success: true,
      data: report,
      count: report.length
    });
  } catch (error) {
    console.error('Error getting budget utilization report:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
