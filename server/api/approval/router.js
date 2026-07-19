/**
 * Approval Workflow API Router
 * Express router for approval workflow endpoints
 */

const express = require('express');
const router = express.Router();
const {
  createWorkflowConfiguration,
  addWorkflowStages,
  startWorkflowInstance,
  approveWorkflowStage,
  rejectWorkflow,
  delegateApproval,
  getWorkflowStatus,
  getPendingWorkflows,
  getWorkflowConfiguration
} = require('./workflow');

/**
 * POST /api/approval/configurations
 * Create a new workflow configuration
 */
router.post('/configurations', async (req, res) => {
  try {
    const { tenant_id, ...workflowConfig } = req.body;
    
    if (!tenant_id) {
      return res.status(400).json({
        success: false,
        error: 'tenant_id is required'
      });
    }
    
    const configuration = await createWorkflowConfiguration(tenant_id, workflowConfig);
    res.status(201).json({
      success: true,
      data: configuration
    });
  } catch (error) {
    console.error('Error creating workflow configuration:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/approval/configurations/:id/stages
 * Add stages to a workflow configuration
 */
router.post('/configurations/:id/stages', async (req, res) => {
  try {
    const { id } = req.params;
    const { stages } = req.body;
    
    if (!stages || !Array.isArray(stages)) {
      return res.status(400).json({
        success: false,
        error: 'stages array is required'
      });
    }
    
    const result = await addWorkflowStages(parseInt(id), stages);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error adding workflow stages:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/approval/instances
 * Start a new workflow instance
 */
router.post('/instances', async (req, res) => {
  try {
    const { tenant_id, ...workflowData } = req.body;
    
    if (!tenant_id) {
      return res.status(400).json({
        success: false,
        error: 'tenant_id is required'
      });
    }
    
    const instance = await startWorkflowInstance(tenant_id, workflowData);
    res.status(201).json({
      success: true,
      data: instance
    });
  } catch (error) {
    console.error('Error starting workflow instance:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/approval/instances/:id/approve
 * Approve a workflow stage
 */
router.post('/instances/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const approverData = req.body;
    
    const instance = await approveWorkflowStage(parseInt(id), approverData);
    res.json({
      success: true,
      data: instance
    });
  } catch (error) {
    console.error('Error approving workflow stage:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/approval/instances/:id/reject
 * Reject a workflow
 */
router.post('/instances/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const rejectorData = req.body;
    
    const instance = await rejectWorkflow(parseInt(id), rejectorData);
    res.json({
      success: true,
      data: instance
    });
  } catch (error) {
    console.error('Error rejecting workflow:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/approval/instances/:id/delegate
 * Delegate approval to another user
 */
router.post('/instances/:id/delegate', async (req, res) => {
  try {
    const { id } = req.params;
    const delegationData = req.body;
    
    const result = await delegateApproval(parseInt(id), delegationData);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error delegating approval:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/approval/instances/:id
 * Get workflow instance status
 */
router.get('/instances/:id', async (req, res) => {
  try {
    const status = await getWorkflowStatus(parseInt(req.params.id));
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error getting workflow status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/approval/pending/:tenantId/:userId
 * Get pending workflows for a user
 */
router.get('/pending/:tenantId/:userId', async (req, res) => {
  try {
    const workflows = await getPendingWorkflows(
      req.params.tenantId,
      req.params.userId
    );
    res.json({
      success: true,
      data: workflows,
      count: workflows.length
    });
  } catch (error) {
    console.error('Error getting pending workflows:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/approval/configurations/:tenantId/:type
 * Get workflow configuration by type
 */
router.get('/configurations/:tenantId/:type', async (req, res) => {
  try {
    const configuration = await getWorkflowConfiguration(
      req.params.tenantId,
      req.params.type
    );
    res.json({
      success: true,
      data: configuration
    });
  } catch (error) {
    console.error('Error getting workflow configuration:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
